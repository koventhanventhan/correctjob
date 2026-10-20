using HireConnect.API.Data;
using HireConnect.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using HireConnect.API.Services;
using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using Microsoft.Extensions.Caching.Memory;

namespace HireConnect.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")] // Global admin auth
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IAuditLogService _auditLogService;
        private readonly ISystemSettingService _settingsService;
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IMemoryCache _memoryCache;

        public AdminController(
            AppDbContext context,
            IAuditLogService auditLogService,
            ISystemSettingService settingsService,
            UserManager<User> userManager,
            RoleManager<IdentityRole> roleManager,
            IMemoryCache memoryCache)
        {
            _context = context;
            _auditLogService = auditLogService;
            _settingsService = settingsService;
            _userManager = userManager;
            _roleManager = roleManager;
            _memoryCache = memoryCache;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers(
            [FromQuery] string? search,
            [FromQuery] string? role,
            [FromQuery] string? status,
            [FromQuery] string? sortBy = "createdAt",
            [FromQuery] string? sortOrder = "desc",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            pageSize = Math.Clamp(pageSize, 1, 50);
            page = Math.Max(1, page);

            var query = _context.Users.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var trimmed = search.Trim();
                query = query.Where(u => u.FullName.Contains(trimmed) || (u.Email != null && u.Email.Contains(trimmed)));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                if (status.Equals("Active", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(u => u.IsActive);
                }
                else if (status.Equals("Blocked", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(u => !u.IsActive);
                }
            }

            if (!string.IsNullOrWhiteSpace(role))
            {
                var roleId = await _context.Roles.Where(r => r.Name == role).Select(r => r.Id).FirstOrDefaultAsync();
                if (roleId != null)
                {
                    query = query.Where(u => _context.UserRoles.Any(ur => ur.UserId == u.Id && ur.RoleId == roleId));
                }
            }

            var totalCount = await query.CountAsync();

            bool isAsc = string.Equals(sortOrder, "asc", StringComparison.OrdinalIgnoreCase);
            query = sortBy?.ToLowerInvariant() switch
            {
                "fullname" => isAsc ? query.OrderBy(u => u.FullName) : query.OrderByDescending(u => u.FullName),
                "email" => isAsc ? query.OrderBy(u => u.Email) : query.OrderByDescending(u => u.Email),
                "lastlogin" => isAsc ? query.OrderBy(u => u.LastLogin) : query.OrderByDescending(u => u.LastLogin),
                _ => isAsc ? query.OrderBy(u => u.CreatedAt) : query.OrderByDescending(u => u.CreatedAt)
            };

            var users = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new 
                { 
                    u.Id, 
                    u.FullName, 
                    u.Email, 
                    u.IsActive,
                    u.CreatedAt,
                    u.BlockedReason,
                    u.LastLogin,
                    u.MustChangePassword,
                    Role = _context.UserRoles
                        .Where(ur => ur.UserId == u.Id)
                        .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
                        .FirstOrDefault() ?? "JobSeeker"
                })
                .ToListAsync();

            return Ok(new { data = users, totalCount, page, pageSize });
        }

        [HttpGet("jobs")]
        public async Task<IActionResult> GetJobs([FromQuery] string? search, [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var query = _context.Jobs.Include(j => j.Company).AsQueryable();
            
            if (!string.IsNullOrEmpty(status)) 
                query = query.Where(j => j.Status == status);

            if (!string.IsNullOrEmpty(search))
                query = query.Where(j => j.Title.Contains(search) || j.Company.CompanyName.Contains(search));

            var totalCount = await query.CountAsync();

            var jobs = await query
                .OrderByDescending(j => j.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(j => new
                {
                    j.Id,
                    j.Title,
                    j.Description,
                    j.Requirements,
                    j.Responsibilities,
                    j.Location,
                    j.SalaryMin,
                    j.SalaryMax,
                    j.ExperienceMin,
                    j.ExperienceMax,
                    j.JobType,
                    j.CategoryId,
                    j.Status,
                    j.IsPaid,
                    j.Deadline,
                    j.CreatedAt,
                    j.ClosedByAdmin,
                    j.PublishedAt,
                    Company = j.Company == null ? null : new
                    {
                        j.Company.Id,
                        j.Company.CompanyName,
                        j.Company.Location,
                        j.Company.LogoUrl,
                        j.Company.IsApproved
                    }
                })
                .ToListAsync();

            return Ok(new { data = jobs, totalCount });
        }

        [HttpPatch("jobs/{id}/approve")]
        public async Task<IActionResult> ApproveJob(int id, [FromBody] JsonElement body)
        {
            var job = await _context.Jobs.Include(j => j.Company).FirstOrDefaultAsync(j => j.Id == id);
            if (job == null) return NotFound();

            string? status = null;
            string? reason = null;
            if (body.ValueKind == JsonValueKind.String)
            {
                status = body.GetString();
            }
            else if (body.ValueKind == JsonValueKind.Object)
            {
                if (body.TryGetProperty("status", out var statusProp))
                {
                    status = statusProp.GetString();
                }
                if (body.TryGetProperty("reason", out var reasonProp))
                {
                    reason = reasonProp.GetString();
                }
                else if (body.TryGetProperty("notes", out var notesProp))
                {
                    reason = notesProp.GetString();
                }
            }

            if (string.IsNullOrWhiteSpace(status) || string.Equals(status, "Approved", StringComparison.OrdinalIgnoreCase))
            {
                status = "Published";
            }

            var allowedStatuses = new[] { "Published", "Rejected", "PendingApproval", "Draft", "Closed" };
            var matchedStatus = allowedStatuses.FirstOrDefault(s => string.Equals(s, status, StringComparison.OrdinalIgnoreCase));
            if (matchedStatus == null)
            {
                return BadRequest(new { message = $"Invalid status '{status}'. Allowed statuses are: {string.Join(", ", allowedStatuses)}" });
            }

            if (!string.IsNullOrEmpty(reason) && reason.Length > 500)
            {
                return BadRequest(new { message = "Rejection reason cannot exceed 500 characters." });
            }

            job.Status = matchedStatus;
            if (matchedStatus == "Published" && job.PublishedAt == null)
            {
                job.PublishedAt = DateTime.UtcNow;
            }
            if (matchedStatus == "Closed")
            {
                job.ClosedByAdmin = true;
            }
            else
            {
                job.ClosedByAdmin = false;
            }

            // Send notification to employer
            if (job.Company != null && !string.IsNullOrEmpty(job.Company.EmployerId))
            {
                if (matchedStatus == "Published")
                {
                    _context.Notifications.Add(new Notification
                    {
                        UserId = job.Company.EmployerId,
                        Title = "Job Approved",
                        Message = $"Your job posting '{job.Title}' has been approved and published.",
                        CreatedAt = DateTime.UtcNow,
                        IsRead = false
                    });
                }
                else if (matchedStatus == "Rejected")
                {
                    var reasonText = !string.IsNullOrWhiteSpace(reason) ? $" Reason: {reason.Trim()}" : "";
                    _context.Notifications.Add(new Notification
                    {
                        UserId = job.Company.EmployerId,
                        Title = "Job Rejected",
                        Message = $"Your job posting '{job.Title}' was rejected.{reasonText}",
                        CreatedAt = DateTime.UtcNow,
                        IsRead = false
                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new
            {
                job.Id,
                job.Title,
                job.Status,
                message = $"Job status updated to '{job.Status}' successfully."
            });
        }

        [HttpGet("companies")]
        public async Task<IActionResult> GetCompanies([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var query = _context.Companies.Include(c => c.Employer).AsQueryable();
            if (!string.IsNullOrEmpty(search))
                query = query.Where(c => c.CompanyName.Contains(search));

            var totalCount = await query.CountAsync();
            var companies = await query
                .OrderByDescending(c => c.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new
                {
                    c.Id,
                    c.CompanyName,
                    c.Description,
                    c.Website,
                    c.Location,
                    c.LogoUrl,
                    c.VerificationStatus,
                    c.IsApproved,
                    Employer = c.Employer == null ? null : new
                    {
                        c.Employer.Id,
                        c.Employer.FullName,
                        c.Employer.Email,
                        c.Employer.IsActive
                    }
                })
                .ToListAsync();

            return Ok(new { data = companies, totalCount });
        }

        [HttpPatch("companies/{id}/approve")]
        public async Task<IActionResult> ApproveCompany(int id, [FromBody] bool isApproved = true)
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null) return NotFound();

            company.IsApproved = isApproved;

            if (!string.IsNullOrEmpty(company.EmployerId))
            {
                _context.Notifications.Add(new Notification
                {
                    UserId = company.EmployerId,
                    Title = isApproved ? "Company Approved" : "Company Approval Revoked",
                    Message = isApproved 
                        ? $"Your company '{company.CompanyName}' has been approved by admin." 
                        : $"Your company '{company.CompanyName}' approval has been revoked.",
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new
            {
                company.Id,
                company.CompanyName,
                company.IsApproved,
                message = isApproved ? "Company approved successfully." : "Company approval revoked successfully."
            });
        }

        [HttpPatch("users/{id}/block")]
        public async Task<IActionResult> BlockUser(string id, [FromBody] BlockUserRequestDto request)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = "User not found." });

            var currentAdminId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "admin";
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

            bool isBlocking = request.IsBlocked.HasValue ? request.IsBlocked.Value : (request.IsActive.HasValue ? !request.IsActive.Value : true);

            if (isBlocking)
            {
                // Reason is required when blocking
                if (string.IsNullOrWhiteSpace(request.Reason))
                {
                    return BadRequest(new { message = "A reason is required to block a user." });
                }

                if (request.Reason.Trim().Length > 500)
                {
                    return BadRequest(new { message = "Reason cannot exceed 500 characters." });
                }

                // Self-block check: Admin cannot block their own account
                if (currentAdminId == id)
                {
                    return BadRequest(new { message = "You cannot block your own admin account." });
                }

                var isAdmin = await _context.UserRoles
                    .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, r.Name })
                    .AnyAsync(x => x.UserId == id && x.Name == "Admin");

                // Last active Admin check: Prevent blocking the last active admin
                if (isAdmin)
                {
                    var adminRoleId = await _context.Roles.Where(r => r.Name == "Admin").Select(r => r.Id).FirstOrDefaultAsync();
                    var activeAdminCount = await _context.UserRoles
                        .Where(ur => ur.RoleId == adminRoleId)
                        .Join(_context.Users.Where(u => u.IsActive), ur => ur.UserId, u => u.Id, (ur, u) => u.Id)
                        .CountAsync();

                    if (activeAdminCount <= 1)
                    {
                        return BadRequest(new { message = "Cannot block the last active administrator." });
                    }
                }

                user.IsActive = false;
                user.BlockedReason = request.Reason.Trim();

                // Revoke all active refresh tokens for this user
                var activeTokens = await _context.RefreshTokens
                    .Where(rt => rt.UserId == user.Id && !rt.IsRevoked)
                    .ToListAsync();
                foreach (var token in activeTokens)
                {
                    token.IsRevoked = true;
                }

                // Send notification with reason
                _context.Notifications.Add(new Notification
                {
                    UserId = user.Id,
                    Title = "Account Suspended",
                    Message = $"Your account has been blocked by an administrator. Reason: {request.Reason.Trim()}",
                    CreatedAt = DateTime.UtcNow
                });

                await _userManager.UpdateSecurityStampAsync(user);
                _memoryCache.Remove($"user_token_val_{user.Id}");

                await _context.SaveChangesAsync();

                // Record immutable audit log
                await _auditLogService.LogAsync(
                    currentAdminId,
                    "BLOCK_USER",
                    "User",
                    user.Id,
                    $"User {user.Email} blocked. Reason: {request.Reason.Trim()}",
                    ip
                );

                return Ok(new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    user.IsActive,
                    user.BlockedReason,
                    message = "User blocked successfully and all active sessions revoked."
                });
            }
            else
            {
                if (request.Reason?.Trim().Length > 500)
                {
                    return BadRequest(new { message = "Reason cannot exceed 500 characters." });
                }

                user.IsActive = true;
                user.BlockedReason = null;

                // Send notification
                _context.Notifications.Add(new Notification
                {
                    UserId = user.Id,
                    Title = "Account Reactivated",
                    Message = string.IsNullOrWhiteSpace(request.Reason)
                        ? "Your account has been reactivated by an administrator."
                        : $"Your account has been reactivated. Note: {request.Reason.Trim()}",
                    CreatedAt = DateTime.UtcNow
                });

                _memoryCache.Remove($"user_token_val_{user.Id}");

                await _context.SaveChangesAsync();

                // Record immutable audit log
                await _auditLogService.LogAsync(
                    currentAdminId,
                    "UNBLOCK_USER",
                    "User",
                    user.Id,
                    $"User {user.Email} unblocked. Note: {request.Reason?.Trim() ?? "None"}",
                    ip
                );

                return Ok(new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    user.IsActive,
                    message = "User unblocked successfully."
                });
            }
        }

        [HttpPost("admins")]
        public async Task<IActionResult> CreateAdmin([FromBody] CreateAdminRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || !new EmailAddressAttribute().IsValid(request.Email))
            {
                return BadRequest(new { message = "A valid email address is required." });
            }

            if (string.IsNullOrWhiteSpace(request.FullName))
            {
                return BadRequest(new { message = "Full name is required." });
            }

            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
            {
                return Conflict(new { message = "A user with this email address already exists." });
            }

            // Strong password policy: Identity rules + min 12 characters
            if (string.IsNullOrEmpty(request.Password) || request.Password.Length < 12)
            {
                return BadRequest(new { message = "Admin password must be at least 12 characters long." });
            }
            if (!request.Password.Any(char.IsUpper))
            {
                return BadRequest(new { message = "Admin password must contain at least one uppercase letter." });
            }
            if (!request.Password.Any(char.IsLower))
            {
                return BadRequest(new { message = "Admin password must contain at least one lowercase letter." });
            }
            if (!request.Password.Any(char.IsDigit))
            {
                return BadRequest(new { message = "Admin password must contain at least one number." });
            }
            if (!request.Password.Any(ch => !char.IsLetterOrDigit(ch)))
            {
                return BadRequest(new { message = "Admin password must contain at least one special character." });
            }

            var newAdmin = new User
            {
                UserName = request.Email,
                Email = request.Email,
                FullName = request.FullName.Trim(),
                IsActive = true,
                MustChangePassword = request.ForcePasswordChangeOnFirstLogin,
                CreatedAt = DateTime.UtcNow
            };

            var createResult = await _userManager.CreateAsync(newAdmin, request.Password);
            if (!createResult.Succeeded)
            {
                return BadRequest(new { message = string.Join("; ", createResult.Errors.Select(e => e.Description)) });
            }

            if (!await _roleManager.RoleExistsAsync("Admin"))
            {
                await _roleManager.CreateAsync(new IdentityRole("Admin"));
            }

            await _userManager.AddToRoleAsync(newAdmin, "Admin");

            var currentAdminId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "admin";
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

            // Record audit log (password is NEVER logged)
            await _auditLogService.LogAsync(
                currentAdminId,
                "CREATE_ADMIN",
                "User",
                newAdmin.Id,
                $"Admin account created for {newAdmin.Email} (ForcePasswordChange: {newAdmin.MustChangePassword})",
                ip
            );

            return Ok(new
            {
                message = "Administrator account created successfully.",
                admin = new
                {
                    newAdmin.Id,
                    newAdmin.FullName,
                    newAdmin.Email,
                    Role = "Admin",
                    newAdmin.IsActive,
                    newAdmin.CreatedAt,
                    newAdmin.MustChangePassword
                }
            });
        }

        [HttpDelete("admins/{id}")]
        public async Task<IActionResult> RemoveAdmin(string id)
        {
            var targetUser = await _userManager.FindByIdAsync(id);
            if (targetUser == null)
            {
                return NotFound(new { message = "User not found." });
            }

            if (!await _userManager.IsInRoleAsync(targetUser, "Admin"))
            {
                return BadRequest(new { message = "User is not an administrator." });
            }

            var currentAdminId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // Self-removal protection
            if (currentAdminId == id)
            {
                return BadRequest(new { message = "You cannot remove or demote your own administrator account." });
            }

            // Last active Admin protection
            var adminRoleId = await _context.Roles.Where(r => r.Name == "Admin").Select(r => r.Id).FirstOrDefaultAsync();
            var activeAdminCount = await _context.UserRoles
                .Where(ur => ur.RoleId == adminRoleId)
                .Join(_context.Users.Where(u => u.IsActive), ur => ur.UserId, u => u.Id, (ur, u) => u.Id)
                .CountAsync();

            if (activeAdminCount <= 1)
            {
                return BadRequest(new { message = "Cannot remove the last active administrator." });
            }

            await _userManager.RemoveFromRoleAsync(targetUser, "Admin");
            if (!await _userManager.IsInRoleAsync(targetUser, "JobSeeker"))
            {
                await _userManager.AddToRoleAsync(targetUser, "JobSeeker");
            }

            // Revoke active refresh tokens
            var activeTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == targetUser.Id && !rt.IsRevoked)
                .ToListAsync();
            foreach (var token in activeTokens)
            {
                token.IsRevoked = true;
            }

            _context.Notifications.Add(new Notification
            {
                UserId = targetUser.Id,
                Title = "Administrator Privileges Revoked",
                Message = "Your administrator privileges on HireConnect have been revoked by a system administrator.",
                CreatedAt = DateTime.UtcNow
            });

            await _userManager.UpdateSecurityStampAsync(targetUser);
            _memoryCache.Remove($"user_token_val_{targetUser.Id}");

            await _context.SaveChangesAsync();

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.LogAsync(
                currentAdminId ?? "admin",
                "REMOVE_ADMIN",
                "User",
                targetUser.Id,
                $"Admin privileges revoked for {targetUser.Email}",
                ip
            );

            return Ok(new { message = "Administrator privileges revoked successfully." });
        }

        [HttpDelete("jobs/{id}")]
        public async Task<IActionResult> DeleteJob(int id)
        {
            var job = await _context.Jobs.FindAsync(id);
            if (job == null) return NotFound();

            // 1. Clean up Applications & their children (Answers, Messages)
            var applications = await _context.Applications.Where(a => a.JobId == id).ToListAsync();
            if (applications.Any())
            {
                var appIds = applications.Select(a => a.Id).ToList();
                var answers = await _context.ApplicationAnswers.Where(ans => appIds.Contains(ans.ApplicationId)).ToListAsync();
                _context.ApplicationAnswers.RemoveRange(answers);

                var messages = await _context.Messages.Where(m => appIds.Contains(m.ApplicationId)).ToListAsync();
                _context.Messages.RemoveRange(messages);

                _context.Applications.RemoveRange(applications);
            }

            // 2. Clean up Screening Questions & any remaining answers
            var questions = await _context.JobScreeningQuestions.Where(q => q.JobId == id).ToListAsync();
            if (questions.Any())
            {
                var qIds = questions.Select(q => q.Id).ToList();
                var remainingAnswers = await _context.ApplicationAnswers.Where(ans => qIds.Contains(ans.QuestionId)).ToListAsync();
                _context.ApplicationAnswers.RemoveRange(remainingAnswers);

                _context.JobScreeningQuestions.RemoveRange(questions);
            }

            // 3. Clean up SavedJobs
            var savedJobs = await _context.SavedJobs.Where(sj => sj.JobId == id).ToListAsync();
            _context.SavedJobs.RemoveRange(savedJobs);

            // 4. Clean up JobSkills
            var jobSkills = await _context.JobSkills.Where(js => js.JobId == id).ToListAsync();
            _context.JobSkills.RemoveRange(jobSkills);

            // 5. Clean up Reports
            var reports = await _context.Reports.Where(r => r.JobId == id).ToListAsync();
            _context.Reports.RemoveRange(reports);

            _context.Jobs.Remove(job);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("identity-verifications")]
        public async Task<IActionResult> GetIdentityVerifications([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var query = _context.SeekerProfiles
                .Include(s => s.User)
                .Where(s => s.VerificationStatus == "Pending")
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(s => s.User.FullName.Contains(search) || (s.User.Email != null && s.User.Email.Contains(search)));
            }

            var totalCount = await query.CountAsync();
            var verifications = await query
                .OrderByDescending(s => s.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(s => new 
                {
                    s.Id,
                    FullName = s.User.FullName,
                    Email = s.User.Email,
                    s.VerificationStatus,
                    s.IdCardFrontUrl,
                    s.IdCardBackUrl,
                    UserId = s.UserId
                })
                .ToListAsync();

            return Ok(new { data = verifications, totalCount });
        }

        [HttpPatch("identity-verifications/{seekerProfileId}/decision")]
        public async Task<IActionResult> DecideIdentityVerification(int seekerProfileId, [FromBody] VerificationDecisionDto decision)
        {
            var profile = await _context.SeekerProfiles.Include(s => s.User).FirstOrDefaultAsync(s => s.Id == seekerProfileId);
            if (profile == null) return NotFound();

            if (decision.Approved)
            {
                profile.VerificationStatus = "Verified";
                profile.VerifiedAt = DateTime.UtcNow;
            }
            else
            {
                profile.VerificationStatus = "Rejected";
                profile.VerificationNotes = decision.Notes;
            }

            var notification = new Notification
            {
                UserId = profile.UserId,
                Title = decision.Approved ? "Identity Verified" : "Identity Verification Rejected",
                Message = decision.Approved 
                    ? "Your identity verification request has been approved." 
                    : $"Your identity verification request was rejected. Reason: {decision.Notes}"
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();
            return Ok(new { message = "Decision recorded.", status = profile.VerificationStatus });
        }

        [HttpGet("employer-verifications")]
        public async Task<IActionResult> GetEmployerVerifications([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var query = _context.Companies
                .Include(c => c.Employer)
                .Where(c => c.VerificationStatus == "Pending")
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(c => c.Employer.FullName.Contains(search) || (c.Employer.Email != null && c.Employer.Email.Contains(search)) || c.CompanyName.Contains(search));
            }

            var totalCount = await query.CountAsync();
            var verifications = await query
                .OrderByDescending(c => c.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new 
                {
                    c.Id,
                    FullName = c.Employer.FullName,
                    Email = c.Employer.Email,
                    CompanyName = c.CompanyName,
                    c.VerificationStatus,
                    c.IdCardFrontUrl,
                    c.IdCardBackUrl,
                    UserId = c.EmployerId
                })
                .ToListAsync();

            return Ok(new { data = verifications, totalCount });
        }

        [HttpPatch("employer-verifications/{companyId}/decision")]
        public async Task<IActionResult> DecideEmployerVerification(int companyId, [FromBody] VerificationDecisionDto decision)
        {
            var company = await _context.Companies.Include(c => c.Employer).FirstOrDefaultAsync(c => c.Id == companyId);
            if (company == null) return NotFound();

            if (decision.Approved)
            {
                company.VerificationStatus = "Verified";
                company.VerifiedAt = DateTime.UtcNow;
            }
            else
            {
                company.VerificationStatus = "Rejected";
                company.VerificationNotes = decision.Notes;
            }

            var notification = new Notification
            {
                UserId = company.EmployerId,
                Title = decision.Approved ? "Company Verification Approved" : "Company Verification Rejected",
                Message = decision.Approved 
                    ? $"Your company verification for '{company.CompanyName}' has been approved. You can now post jobs." 
                    : $"Your company verification for '{company.CompanyName}' was rejected. Reason: {decision.Notes}",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();
            return Ok(new { message = "Decision recorded.", status = company.VerificationStatus });
        }

        [HttpGet("jobseekers")]
        public async Task<IActionResult> GetJobSeekers([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var query = _context.SeekerProfiles
                .Include(s => s.User)
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(s => s.User.FullName.Contains(search) || (s.User.Email != null && s.User.Email.Contains(search)));
            }

            var totalCount = await query.CountAsync();
            var seekers = await query
                .OrderByDescending(s => s.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(s => new 
                {
                    s.Id, // Profile ID
                    UserId = s.User.Id,
                    FullName = s.User.FullName,
                    Email = s.User.Email,
                    s.User.IsActive,
                    s.VerificationStatus,
                    s.CareerTitle,
                    HasResume = !string.IsNullOrEmpty(s.ResumeUrl),
                    ApplicationsCount = _context.Applications.Count(a => a.SeekerId == s.Id),
                    SavedJobsCount = _context.SavedJobs.Count(sj => sj.SeekerId == s.Id),
                    RegisteredAt = s.User.CreatedAt
                })
                .ToListAsync();

            return Ok(new { data = seekers, totalCount });
        }

        [HttpGet("settings")]
        public async Task<IActionResult> GetSettings()
        {
            var settings = await _settingsService.GetAllSettingsAsync();
            var fee = await _settingsService.GetJobPostingFeeAsync();
            var maintenance = await _settingsService.IsMaintenanceModeAsync();

            return Ok(new
            {
                settings,
                jobPostingFee = fee,
                maintenanceMode = maintenance
            });
        }

        [HttpPut("settings/job-posting-fee")]
        public async Task<IActionResult> UpdateJobPostingFee([FromBody] UpdateJobPostingFeeDto dto)
        {
            var currentAdminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _settingsService.SetJobPostingFeeAsync(dto.Fee, currentAdminId);
            if (!result.Success)
            {
                return BadRequest(new { message = result.ErrorMessage });
            }

            return Ok(new
            {
                message = "Job posting fee updated successfully.",
                jobPostingFee = dto.Fee
            });
        }

        [HttpPut("settings/maintenance-mode")]
        public async Task<IActionResult> UpdateMaintenanceMode([FromBody] UpdateMaintenanceModeDto dto)
        {
            var currentAdminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            await _settingsService.SetMaintenanceModeAsync(dto.Enabled, currentAdminId);

            return Ok(new
            {
                message = $"Maintenance mode {(dto.Enabled ? "enabled" : "disabled")} successfully.",
                maintenanceMode = dto.Enabled
            });
        }

        // Strictly Read-Only Audit Log Viewer (No PUT/DELETE exists)
        [HttpGet("audit-logs")]
        public async Task<IActionResult> GetAuditLogs(
            [FromQuery] string? search,
            [FromQuery] string? action,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var query = _context.AdminAuditLogs
                .Include(a => a.Admin)
                .AsQueryable();

            if (!string.IsNullOrEmpty(action))
            {
                query = query.Where(a => a.Action == action);
            }

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(a => 
                    (a.Details != null && a.Details.Contains(search)) || 
                    a.Action.Contains(search) || 
                    a.Admin.FullName.Contains(search) ||
                    (a.Admin.Email != null && a.Admin.Email.Contains(search)));
            }

            var totalCount = await query.CountAsync();
            var logs = await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new
                {
                    a.Id,
                    a.AdminId,
                    AdminName = a.Admin.FullName,
                    AdminEmail = a.Admin.Email,
                    a.Action,
                    a.TargetType,
                    a.TargetId,
                    a.Details,
                    a.IpHash,
                    a.CreatedAt
                })
                .ToListAsync();

            return Ok(new { data = logs, totalCount });
        }

        [HttpGet("dashboard-stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var adminRoleId = await _context.Roles.Where(r => r.Name == "Admin").Select(r => r.Id).FirstOrDefaultAsync();
            var employerRoleId = await _context.Roles.Where(r => r.Name == "Employer").Select(r => r.Id).FirstOrDefaultAsync();
            var seekerRoleId = await _context.Roles.Where(r => r.Name == "JobSeeker").Select(r => r.Id).FirstOrDefaultAsync();

            var totalUsers = await _context.Users.CountAsync();
            var activeUsers = await _context.Users.CountAsync(u => u.IsActive);
            var blockedUsers = totalUsers - activeUsers;
            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
            var newUsersLast30Days = await _context.Users.CountAsync(u => u.CreatedAt >= thirtyDaysAgo);

            var adminCount = adminRoleId != null ? await _context.UserRoles.CountAsync(ur => ur.RoleId == adminRoleId) : 0;
            var employerCount = employerRoleId != null ? await _context.UserRoles.CountAsync(ur => ur.RoleId == employerRoleId) : 0;
            var seekerCount = seekerRoleId != null ? await _context.UserRoles.CountAsync(ur => ur.RoleId == seekerRoleId) : Math.Max(0, totalUsers - adminCount - employerCount);

            var totalJobs = await _context.Jobs.CountAsync();
            var draftJobs = await _context.Jobs.CountAsync(j => j.Status == "Draft");
            var pendingApprovalJobs = await _context.Jobs.CountAsync(j => j.Status == "PendingApproval");
            var publishedJobs = await _context.Jobs.CountAsync(j => j.Status == "Published" || j.Status == "Approved");
            var closedJobs = await _context.Jobs.CountAsync(j => j.Status == "Closed");
            var rejectedJobs = await _context.Jobs.CountAsync(j => j.Status == "Rejected");

            var totalApplications = await _context.Applications.CountAsync();
            var totalViews = await _context.JobViews.CountAsync();
            var conversionRate = totalViews > 0 ? Math.Round(((double)totalApplications / totalViews) * 100, 2) : 0.0;

            var completedPayments = _context.Payments.Where(p => p.Status == "Completed");
            var totalRevenue = await completedPayments.SumAsync(p => (decimal?)p.Amount) ?? 0m;
            var completedPaymentsCount = await completedPayments.CountAsync();
            var pendingPaymentsCount = await _context.Payments.CountAsync(p => p.Status == "Pending");

            var pendingJobs = draftJobs + pendingApprovalJobs;
            var pendingCompanies = await _context.Companies.CountAsync(c => !c.IsApproved);
            var pendingSeekerVerifications = await _context.SeekerProfiles.CountAsync(s => s.VerificationStatus == "Pending");
            var pendingEmployerVerifications = await _context.Companies.CountAsync(c => c.VerificationStatus == "Pending");
            var pendingReports = await _context.Reports.CountAsync(r => r.Status == "Pending");

            var startDate = DateTime.UtcNow.Date.AddDays(-29);
            var userSignups = await _context.Users
                .Where(u => u.CreatedAt >= startDate)
                .Select(u => u.CreatedAt.Date)
                .ToListAsync();

            var jobPostings = await _context.Jobs
                .Where(j => j.CreatedAt >= startDate)
                .Select(j => j.CreatedAt.Date)
                .ToListAsync();

            var applicationSubmissions = await _context.Applications
                .Where(a => a.AppliedAt >= startDate)
                .Select(a => a.AppliedAt.Date)
                .ToListAsync();

            var trends30Days = Enumerable.Range(0, 30).Select(i =>
            {
                var date = startDate.AddDays(i);
                var dateStr = date.ToString("yyyy-MM-dd");
                return new
                {
                    date = dateStr,
                    signups = userSignups.Count(d => d == date),
                    jobs = jobPostings.Count(d => d == date),
                    applications = applicationSubmissions.Count(d => d == date)
                };
            }).ToList();

            return Ok(new
            {
                users = new
                {
                    total = totalUsers,
                    seekers = seekerCount,
                    employers = employerCount,
                    admins = adminCount,
                    active = activeUsers,
                    blocked = blockedUsers,
                    newLast30Days = newUsersLast30Days
                },
                jobs = new
                {
                    total = totalJobs,
                    draft = draftJobs,
                    pendingApproval = pendingApprovalJobs,
                    published = publishedJobs,
                    closed = closedJobs,
                    rejected = rejectedJobs
                },
                applications = new
                {
                    total = totalApplications,
                    views = totalViews,
                    conversionRate
                },
                revenue = new
                {
                    total = totalRevenue,
                    completedCount = completedPaymentsCount,
                    pendingCount = pendingPaymentsCount
                },
                queues = new
                {
                    pendingJobs,
                    pendingCompanies,
                    pendingSeekerVerifications,
                    pendingEmployerVerifications,
                    pendingReports
                },
                trends30Days
            });
        }

        [HttpPost("audit-logs/test-redaction")]
        public async Task<IActionResult> TestRedaction([FromBody] TestRedactionRequestDto request)
        {
            var currentAdminId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "admin";
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.LogAsync(currentAdminId, "SECURITY_TEST", "SecurityTest", "1", request.Text, ip);
            return Ok(new { message = "Logged successfully." });
        }
    }

    public class BlockUserRequestDto
    {
        public bool? IsActive { get; set; }
        public bool? IsBlocked { get; set; }
        public string? Reason { get; set; }
    }

    public class CreateAdminRequestDto
    {
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public bool ForcePasswordChangeOnFirstLogin { get; set; } = true;
    }

    public class TestRedactionRequestDto
    {
        public string Text { get; set; } = string.Empty;
    }

    public class UpdateJobPostingFeeDto
    {
        public decimal Fee { get; set; }
    }

    public class UpdateMaintenanceModeDto
    {
        public bool Enabled { get; set; }
    }

    public class VerificationDecisionDto
    {
        public bool Approved { get; set; }
        public string? Notes { get; set; }
    }
}
