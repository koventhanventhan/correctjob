using HireConnect.API.Data;
using HireConnect.API.Models;
using HireConnect.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Caching.Memory;

namespace HireConnect.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _context;
        private readonly IFileStorageService _fileStorage;
        private readonly IEmailService _emailService;
        private readonly IWebHostEnvironment _environment;
        private readonly ISystemSettingService _settingsService;
        private readonly IMemoryCache _memoryCache;

        public AuthController(
            UserManager<User> userManager,
            SignInManager<User> signInManager,
            IConfiguration configuration,
            AppDbContext context,
            IFileStorageService fileStorage,
            IEmailService emailService,
            IWebHostEnvironment environment,
            ISystemSettingService settingsService,
            IMemoryCache memoryCache)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
            _context = context;
            _fileStorage = fileStorage;
            _emailService = emailService;
            _environment = environment;
            _settingsService = settingsService;
            _memoryCache = memoryCache;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto model)
        {
            if (await _settingsService.IsMaintenanceModeAsync())
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new 
                { 
                    message = "The platform is currently undergoing scheduled maintenance. New registrations are temporarily paused.", 
                    maintenance = true 
                });
            }

            if (!ModelState.IsValid) return BadRequest(ModelState);

            var allowedRoles = new[] { "JobSeeker", "Employer" };
            if (!allowedRoles.Contains(model.Role))
                return BadRequest(new { message = "Invalid role." });

            var user = new User
            {
                UserName = model.Email,
                Email = model.Email,
                FullName = model.FullName
            };

            var result = await _userManager.CreateAsync(user, model.Password);

            if (result.Succeeded)
            {
                await _userManager.AddToRoleAsync(user, model.Role);
                return Ok(new { message = "User registered successfully" });
            }

            return BadRequest(result.Errors);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null) return Unauthorized(new { message = "Invalid credentials" });

            if (!user.IsActive)
            {
                var blockedMessage = !string.IsNullOrWhiteSpace(user.BlockedReason)
                    ? $"Your account has been blocked: {user.BlockedReason}"
                    : "Your account has been blocked by an administrator.";
                return Unauthorized(new { message = blockedMessage, isBlocked = true, blockedReason = user.BlockedReason });
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, lockoutOnFailure: true);
            if (result.IsLockedOut)
            {
                return StatusCode(StatusCodes.Status423Locked, new { message = "Account locked due to multiple failed login attempts. Please try again after 15 minutes." });
            }
            if (!result.Succeeded) return Unauthorized(new { message = "Invalid credentials" });

            user.LastLogin = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            var roles = await _userManager.GetRolesAsync(user);
            var userRole = roles.FirstOrDefault() ?? "JobSeeker";

            if (!roles.Contains("Admin") && await _settingsService.IsMaintenanceModeAsync())
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new 
                { 
                    message = "The platform is currently undergoing scheduled maintenance. Only administrators can log in at this time.", 
                    maintenance = true 
                });
            }

            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.UserName!),
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Role, userRole),
                new Claim("security_stamp", user.SecurityStamp ?? "")
            };

            var token = CreateToken(authClaims);
            var refreshToken = GenerateRefreshToken();

            var refreshTokenEntity = new RefreshToken
            {
                Token = refreshToken,
                UserId = user.Id,
                ExpiresAt = DateTime.UtcNow.AddDays(int.Parse(_configuration["Jwt:RefreshExpireDays"]!))
            };
            _context.RefreshTokens.Add(refreshTokenEntity);
            await _context.SaveChangesAsync();

            Response.Cookies.Append("refreshToken", refreshToken, GetRefreshTokenCookieOptions(refreshTokenEntity.ExpiresAt));

            return Ok(new
            {
                token = new JwtSecurityTokenHandler().WriteToken(token),
                expiration = token.ValidTo,
                mustChangePassword = user.MustChangePassword,
                user = new 
                { 
                    user.Id, 
                    user.FullName, 
                    user.Email, 
                    user.ProfileImage, 
                    Role = userRole,
                    mustChangePassword = user.MustChangePassword
                }
            });
        }

        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken()
        {
            var refreshToken = Request.Cookies["refreshToken"];
            if (string.IsNullOrEmpty(refreshToken)) return Unauthorized(new { message = "No refresh token found" });

            var tokenEntity = await _context.RefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

            if (tokenEntity == null || tokenEntity.IsRevoked || tokenEntity.ExpiresAt < DateTime.UtcNow || !tokenEntity.User.IsActive)
            {
                Response.Cookies.Delete("refreshToken", GetRefreshTokenCookieOptions(DateTime.UtcNow.AddDays(-1)));
                return Unauthorized(new { message = "Invalid refresh token" });
            }

            tokenEntity.IsRevoked = true;

            var roles = await _userManager.GetRolesAsync(tokenEntity.User);
            var userRole = roles.FirstOrDefault() ?? "JobSeeker";

            if (!roles.Contains("Admin") && await _settingsService.IsMaintenanceModeAsync())
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new 
                { 
                    message = "The platform is currently undergoing scheduled maintenance. Only administrators can access at this time.", 
                    maintenance = true 
                });
            }

            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, tokenEntity.User.UserName!),
                new Claim(ClaimTypes.NameIdentifier, tokenEntity.User.Id),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Role, userRole),
                new Claim("security_stamp", tokenEntity.User.SecurityStamp ?? "")
            };

            var newToken = CreateToken(authClaims);
            var newRefreshToken = GenerateRefreshToken();

            var newRefreshTokenEntity = new RefreshToken
            {
                Token = newRefreshToken,
                UserId = tokenEntity.UserId,
                ExpiresAt = DateTime.UtcNow.AddDays(int.Parse(_configuration["Jwt:RefreshExpireDays"]!))
            };
            _context.RefreshTokens.Add(newRefreshTokenEntity);
            await _context.SaveChangesAsync();

            Response.Cookies.Append("refreshToken", newRefreshToken, GetRefreshTokenCookieOptions(newRefreshTokenEntity.ExpiresAt));

            return Ok(new
            {
                token = new JwtSecurityTokenHandler().WriteToken(newToken),
                expiration = newToken.ValidTo
            });
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var refreshToken = Request.Cookies["refreshToken"];
            if (!string.IsNullOrEmpty(refreshToken))
            {
                var tokenEntity = await _context.RefreshTokens
                    .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

                if (tokenEntity != null)
                {
                    tokenEntity.IsRevoked = true;
                    await _context.SaveChangesAsync();
                }

                Response.Cookies.Delete("refreshToken", GetRefreshTokenCookieOptions(DateTime.UtcNow.AddDays(-1)));
            }

            return Ok(new { message = "Logged out successfully" });
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMe()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null || !user.IsActive) return Unauthorized();

            var roles = await _userManager.GetRolesAsync(user);
            var userRole = roles.FirstOrDefault() ?? "JobSeeker";

            return Ok(new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.ProfileImage,
                Role = userRole,
                mustChangePassword = user.MustChangePassword
            });
        }

        private JwtSecurityToken CreateToken(List<Claim> authClaims)
        {
            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var tokenValidityInMinutes = int.Parse(_configuration["Jwt:ExpireMinutes"]!);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                expires: DateTime.UtcNow.AddMinutes(tokenValidityInMinutes),
                claims: authClaims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );

            return token;
        }

        private static string GenerateRefreshToken()
        {
            return Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(64));
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId!);
            if (user == null) return NotFound();

            // Update full name
            if (!string.IsNullOrWhiteSpace(model.FullName))
            {
                user.FullName = model.FullName.Trim();
            }

            // Update email (also update UserName since it's used as the login identifier)
            if (!string.IsNullOrWhiteSpace(model.Email) && model.Email.Trim() != user.Email)
            {
                var existingUser = await _userManager.FindByEmailAsync(model.Email.Trim());
                if (existingUser != null && existingUser.Id != userId)
                {
                    return BadRequest(new { message = "This email address is already in use." });
                }

                user.Email = model.Email.Trim();
                user.UserName = model.Email.Trim();
                user.NormalizedEmail = model.Email.Trim().ToUpperInvariant();
                user.NormalizedUserName = model.Email.Trim().ToUpperInvariant();
            }

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest(new { message = "Failed to update profile.", errors = result.Errors });
            }

            var roles = await _userManager.GetRolesAsync(user);
            var userRole = roles.FirstOrDefault() ?? "JobSeeker";

            return Ok(new
            {
                message = "Profile updated successfully.",
                user = new { user.Id, user.FullName, user.Email, user.ProfileImage, Role = userRole }
            });
        }

        [HttpPost("profile-image")]
        [Authorize]
        [RequestSizeLimit(2097152)] // 2MB limit
        public async Task<IActionResult> UploadProfileImage(IFormFile? file)
        {
            file ??= Request.Form.Files.FirstOrDefault();
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No image file provided." });

            const long maxFileSize = 2 * 1024 * 1024;
            if (file.Length > maxFileSize)
                return BadRequest(new { message = "File size exceeds the 2MB limit." });

            var allowedContentTypes = new[] { "image/jpeg", "image/png" };
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!allowedContentTypes.Contains(file.ContentType.ToLowerInvariant()) || !allowedExtensions.Contains(extension))
            {
                return BadRequest(new { message = "Invalid file type. Only JPEG and PNG images are allowed." });
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId!);
            if (user == null) return Unauthorized();

            if (!string.IsNullOrEmpty(user.ProfileImage))
            {
                await _fileStorage.DeleteFileAsync(user.ProfileImage);
            }

            var imageUrl = await _fileStorage.UploadFileAsync(file, "profile-images");
            user.ProfileImage = imageUrl;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest(new { message = "Failed to update profile image.", errors = result.Errors });
            }

            var roles = await _userManager.GetRolesAsync(user);
            var userRole = roles.FirstOrDefault() ?? "JobSeeker";

            return Ok(new
            {
                message = "Profile image updated successfully.",
                profileImage = imageUrl,
                user = new { user.Id, user.FullName, user.Email, user.ProfileImage, Role = userRole }
            });
        }

        [HttpPost("change-email")]
        [Authorize]
        public async Task<IActionResult> ChangeEmail([FromBody] ChangeEmailDto model)
        {
            if (string.IsNullOrWhiteSpace(model.NewEmail))
                return BadRequest(new { message = "New email address is required." });

            var trimmedNewEmail = model.NewEmail.Trim();
            if (!new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(trimmedNewEmail))
                return BadRequest(new { message = "Invalid email format." });

            if (string.IsNullOrWhiteSpace(model.CurrentPassword))
                return BadRequest(new { message = "Current password is required to change email." });

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId!);
            if (user == null) return Unauthorized();

            var passwordCheck = await _userManager.CheckPasswordAsync(user, model.CurrentPassword);
            if (!passwordCheck)
                return BadRequest(new { message = "Incorrect current password." });

            if (string.Equals(trimmedNewEmail, user.Email, StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "The new email cannot be the same as your current email." });

            var existingUser = await _userManager.FindByEmailAsync(trimmedNewEmail);
            if (existingUser != null && existingUser.Id != user.Id)
                return BadRequest(new { message = "This email address is already in use by another account." });

            user.Email = trimmedNewEmail;
            user.UserName = trimmedNewEmail;
            user.NormalizedEmail = trimmedNewEmail.ToUpperInvariant();
            user.NormalizedUserName = trimmedNewEmail.ToUpperInvariant();

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return BadRequest(new { message = "Failed to update email.", errors = result.Errors });

            var roles = await _userManager.GetRolesAsync(user);
            var userRole = roles.FirstOrDefault() ?? "JobSeeker";

            return Ok(new
            {
                message = "Email address updated successfully.",
                user = new { user.Id, user.FullName, user.Email, user.ProfileImage, Role = userRole }
            });
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId!);
            if (user == null) return NotFound();

            var result = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
            if (!result.Succeeded) return BadRequest(result.Errors);

            user.MustChangePassword = false;
            await _userManager.UpdateAsync(user);

            // Invalidate validation cache so subsequent requests immediately see MustChangePassword=false
            _memoryCache.Remove($"user_token_val_{user.Id}");

            // Revoke all refresh tokens for this user upon password change
            var userTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == user.Id && !rt.IsRevoked)
                .ToListAsync();
            foreach (var rt in userTokens)
            {
                rt.IsRevoked = true;
            }
            await _context.SaveChangesAsync();

            var roles = await _userManager.GetRolesAsync(user);
            var userRole = roles.FirstOrDefault() ?? "JobSeeker";
            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.UserName!),
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Role, userRole),
                new Claim("security_stamp", user.SecurityStamp ?? "")
            };

            var newToken = CreateToken(authClaims);
            var newRefreshToken = GenerateRefreshToken();
            var newRefreshTokenEntity = new RefreshToken
            {
                Token = newRefreshToken,
                UserId = user.Id,
                ExpiresAt = DateTime.UtcNow.AddDays(int.Parse(_configuration["Jwt:RefreshExpireDays"]!))
            };
            _context.RefreshTokens.Add(newRefreshTokenEntity);
            await _context.SaveChangesAsync();

            Response.Cookies.Append("refreshToken", newRefreshToken, GetRefreshTokenCookieOptions(newRefreshTokenEntity.ExpiresAt));

            return Ok(new 
            { 
                message = "Password changed successfully",
                token = new JwtSecurityTokenHandler().WriteToken(newToken),
                mustChangePassword = false,
                user = new 
                { 
                    user.Id, 
                    user.FullName, 
                    user.Email, 
                    user.ProfileImage, 
                    Role = userRole,
                    mustChangePassword = false
                }
            });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto model)
        {
            if (string.IsNullOrWhiteSpace(model.Email))
            {
                return BadRequest(new { message = "Email is required." });
            }

            var user = await _userManager.FindByEmailAsync(model.Email.Trim());
            if (user != null && user.IsActive)
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                await _emailService.SendPasswordResetEmailAsync(user.Email!, token);
            }

            // Never return token in API response, and no hardcoded Console.WriteLine
            return Ok(new { 
                message = "If the email exists, a reset link has been sent."
            });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null) return BadRequest("Invalid request.");

            var result = await _userManager.ResetPasswordAsync(user, model.Token, model.NewPassword);
            if (!result.Succeeded) return BadRequest(result.Errors);

            // Revoke all refresh tokens for this user upon password reset
            var userTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == user.Id && !rt.IsRevoked)
                .ToListAsync();
            foreach (var rt in userTokens)
            {
                rt.IsRevoked = true;
            }
            await _userManager.UpdateSecurityStampAsync(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Password reset successfully." });
        }

        private CookieOptions GetRefreshTokenCookieOptions(DateTime? expires = null)
        {
            var sameSiteConfig = _configuration["CookieSettings:SameSite"];
            var secureConfig = _configuration["CookieSettings:Secure"];

            SameSiteMode sameSiteMode;
            if (!string.IsNullOrEmpty(sameSiteConfig))
            {
                if (string.Equals(sameSiteConfig, "None", StringComparison.OrdinalIgnoreCase))
                    sameSiteMode = SameSiteMode.None;
                else if (string.Equals(sameSiteConfig, "Strict", StringComparison.OrdinalIgnoreCase))
                    sameSiteMode = SameSiteMode.Strict;
                else
                    sameSiteMode = SameSiteMode.Lax;
            }
            else
            {
                // In Development over HTTP localhost, default to Lax; in Production, default to None for cross-domain cookie support
                sameSiteMode = _environment.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.None;
            }

            bool isSecure;
            if (!string.IsNullOrEmpty(secureConfig) && bool.TryParse(secureConfig, out var configuredSecure))
            {
                isSecure = configuredSecure;
            }
            else
            {
                // Browsers mandate Secure=true when SameSite=None
                isSecure = sameSiteMode == SameSiteMode.None || !_environment.IsDevelopment();
            }

            var options = new CookieOptions
            {
                HttpOnly = true,
                Secure = isSecure,
                SameSite = sameSiteMode,
                Path = "/"
            };

            if (expires.HasValue)
            {
                options.Expires = expires.Value;
            }

            return options;
        }
    }

    public class ChangeEmailDto
    {
        public string NewEmail { get; set; } = string.Empty;
        public string CurrentPassword { get; set; } = string.Empty;
    }

    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    public class UpdateProfileDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }

    public class ForgotPasswordDto
    {
        public string Email { get; set; } = string.Empty;
    }

    public class ResetPasswordDto
    {
        public string Email { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    public class RegisterDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = "JobSeeker"; // JobSeeker, Employer
    }

    public class LoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
