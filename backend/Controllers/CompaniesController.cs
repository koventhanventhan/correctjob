using HireConnect.API.Data;
using HireConnect.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HireConnect.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CompaniesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly HireConnect.API.Services.IFileStorageService _fileStorage;

        public CompaniesController(AppDbContext context, HireConnect.API.Services.IFileStorageService fileStorage)
        {
            _context = context;
            _fileStorage = fileStorage;
        }

        [HttpGet]
        public async Task<IActionResult> GetCompanies([FromQuery] int page = 1, [FromQuery] int pageSize = 12)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            // Public can only see approved companies
            var query = _context.Companies.Where(c => c.IsApproved);
            
            var totalCount = await query.CountAsync();
            var companies = await query
                .OrderBy(c => c.CompanyName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => MapToPublicDto(c, userId))
                .ToListAsync();

            return Ok(new { data = companies, totalCount });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCompany(int id)
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null) return NotFound();

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var isAdmin = User.IsInRole("Admin");

            if (!company.IsApproved)
            {
                if (!isAdmin && (userId == null || company.EmployerId != userId))
                {
                    return NotFound();
                }
            }

            return Ok(MapToPublicDto(company, userId));
        }

        [HttpGet("my-company")]
        [Authorize(Roles = "Employer")]
        public async Task<IActionResult> GetMyCompany()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.EmployerId == userId);
            
            if (company == null) return NotFound();
            return Ok(MapToDto(company));
        }

        [HttpPost]
        [Authorize(Roles = "Employer")]
        public async Task<IActionResult> CreateCompany([FromBody] CompanyDto model)
        {
            var (isValid, urlError) = ValidateCompanyUrls(model);
            if (!isValid) return BadRequest(new { message = urlError });

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var existing = await _context.Companies.FirstOrDefaultAsync(c => c.EmployerId == userId);
            if (existing != null) return BadRequest(new { message = "You already have a company profile." });

            var company = new Company
            {
                EmployerId = userId!,
                CompanyName = model.CompanyName.Trim(),
                Description = model.Description?.Trim(),
                Benefits = model.Benefits?.Trim(),
                Industry = model.Industry?.Trim(),
                Location = model.Location?.Trim(),
                CompanySize = model.CompanySize?.Trim(),
                Website = string.IsNullOrWhiteSpace(model.Website) ? null : model.Website.Trim(),
                LinkedinUrl = string.IsNullOrWhiteSpace(model.LinkedinUrl) ? null : model.LinkedinUrl.Trim(),
                TwitterUrl = string.IsNullOrWhiteSpace(model.TwitterUrl) ? null : model.TwitterUrl.Trim(),
                FacebookUrl = string.IsNullOrWhiteSpace(model.FacebookUrl) ? null : model.FacebookUrl.Trim(),
                IsApproved = false // Needs Admin approval
            };

            _context.Companies.Add(company);
            await _context.SaveChangesAsync();

            return Ok(MapToDto(company));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Employer")]
        public async Task<IActionResult> UpdateCompany(int id, [FromBody] CompanyDto model)
        {
            var (isValid, urlError) = ValidateCompanyUrls(model);
            if (!isValid) return BadRequest(new { message = urlError });

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var company = await _context.Companies.FindAsync(id);
            
            if (company == null) return NotFound();
            if (company.EmployerId != userId) return Forbid(); // Ownership check

            company.CompanyName = model.CompanyName.Trim();
            company.Description = model.Description?.Trim();
            company.Benefits = model.Benefits?.Trim();
            company.Industry = model.Industry?.Trim();
            company.Location = model.Location?.Trim();
            company.CompanySize = model.CompanySize?.Trim();
            company.Website = string.IsNullOrWhiteSpace(model.Website) ? null : model.Website.Trim();
            company.LinkedinUrl = string.IsNullOrWhiteSpace(model.LinkedinUrl) ? null : model.LinkedinUrl.Trim();
            company.TwitterUrl = string.IsNullOrWhiteSpace(model.TwitterUrl) ? null : model.TwitterUrl.Trim();
            company.FacebookUrl = string.IsNullOrWhiteSpace(model.FacebookUrl) ? null : model.FacebookUrl.Trim();

            await _context.SaveChangesAsync();
            return Ok(MapToDto(company));
        }

        [HttpPost("upload-logo")]
        [Authorize(Roles = "Employer")]
        [RequestSizeLimit(3145728)] // 3MB limit
        public async Task<IActionResult> UploadLogo(IFormFile? file)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.EmployerId == userId);
            if (company == null) return NotFound(new { message = "Company profile not found." });

            var uploadedFile = file ?? Request.Form.Files.FirstOrDefault();
            if (uploadedFile == null || uploadedFile.Length == 0)
                return BadRequest(new { message = "No file uploaded." });

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var ext = Path.GetExtension(uploadedFile.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(ext))
                return BadRequest(new { message = "Only JPG, PNG, and WebP images are allowed." });

            if (uploadedFile.Length > 2 * 1024 * 1024)
                return BadRequest(new { message = "Logo file size cannot exceed 2MB." });

            // Delete old logo file if present
            if (!string.IsNullOrEmpty(company.LogoUrl))
            {
                try { await _fileStorage.DeleteFileAsync(company.LogoUrl); } catch { /* ignore error */ }
            }

            var url = await _fileStorage.UploadFileAsync(uploadedFile, "company-logos");
            company.LogoUrl = url;
            await _context.SaveChangesAsync();

            return Ok(new { logoUrl = url });
        }

        [HttpPost("upload-banner")]
        [Authorize(Roles = "Employer")]
        [RequestSizeLimit(6291456)] // 6MB limit
        public async Task<IActionResult> UploadBanner(IFormFile? file)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.EmployerId == userId);
            if (company == null) return NotFound(new { message = "Company profile not found." });

            var uploadedFile = file ?? Request.Form.Files.FirstOrDefault();
            if (uploadedFile == null || uploadedFile.Length == 0)
                return BadRequest(new { message = "No file uploaded." });

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var ext = Path.GetExtension(uploadedFile.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(ext))
                return BadRequest(new { message = "Only JPG, PNG, and WebP images are allowed." });

            if (uploadedFile.Length > 5 * 1024 * 1024)
                return BadRequest(new { message = "Banner file size cannot exceed 5MB." });

            // Delete old banner file if present
            if (!string.IsNullOrEmpty(company.BannerUrl))
            {
                try { await _fileStorage.DeleteFileAsync(company.BannerUrl); } catch { /* ignore error */ }
            }

            var url = await _fileStorage.UploadFileAsync(uploadedFile, "company-banners");
            company.BannerUrl = url;
            await _context.SaveChangesAsync();

            return Ok(new { bannerUrl = url });
        }

        [HttpPost("verify-identity")]
        [Authorize(Roles = "Employer")]
        [RequestSizeLimit(12582912)] // 12MB limit
        public async Task<IActionResult> VerifyIdentity([FromForm] IFormFile? idCardFront, [FromForm] IFormFile? idCardBack)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.EmployerId == userId);
            if (company == null) return NotFound("Company profile not found.");

            var front = idCardFront ?? Request.Form.Files["idFront"] ?? Request.Form.Files["front"];
            var back = idCardBack ?? Request.Form.Files["idBack"] ?? Request.Form.Files["back"];

            if (front == null || back == null)
            {
                return BadRequest(new { message = "Both front and back of the ID card are required." });
            }

            var allowedTypes = new[] { "image/jpeg", "image/png", "application/pdf" };
            if (!allowedTypes.Contains(front.ContentType.ToLowerInvariant()) || !allowedTypes.Contains(back.ContentType.ToLowerInvariant()))
            {
                return BadRequest(new { message = "Only JPG, PNG, or PDF files are allowed." });
            }

            if (front.Length > 5 * 1024 * 1024 || back.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new { message = "File size cannot exceed 5MB." });
            }

            var frontUrl = await _fileStorage.UploadFileAsync(front, "id-cards");
            var backUrl = await _fileStorage.UploadFileAsync(back, "id-cards");

            company.IdCardFrontUrl = frontUrl;
            company.IdCardBackUrl = backUrl;
            company.VerificationStatus = "Pending";
            company.VerificationNotes = null;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Identity verification submitted successfully.", status = company.VerificationStatus });
        }

        [HttpGet("id-card/{side}")]
        [Authorize]
        public async Task<IActionResult> DownloadIdCard(string side, [FromQuery] int companyId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");

            var company = await _context.Companies.FirstOrDefaultAsync(c => c.Id == companyId);
            if (company == null) return NotFound();

            if (!isAdmin && company.EmployerId != userId)
            {
                return Forbid();
            }

            var fileName = side.ToLower() == "front" ? company.IdCardFrontUrl : company.IdCardBackUrl;
            if (string.IsNullOrEmpty(fileName)) return NotFound();

            var filePath = _fileStorage.GetPhysicalFilePath(fileName, "id-cards");
            if (string.IsNullOrEmpty(filePath) || !System.IO.File.Exists(filePath)) return NotFound();

            var provider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(filePath, out var contentType))
            {
                contentType = "application/octet-stream";
            }

            return PhysicalFile(filePath, contentType, Path.GetFileName(filePath));
        }

        private static (bool IsValid, string? ErrorMessage) ValidateCompanyUrls(CompanyDto model)
        {
            var urls = new (string? Value, string Name)[]
            {
                (model.Website, "Website"),
                (model.LinkedinUrl, "LinkedIn URL"),
                (model.TwitterUrl, "Twitter URL"),
                (model.FacebookUrl, "Facebook URL")
            };

            foreach (var (val, name) in urls)
            {
                if (string.IsNullOrWhiteSpace(val)) continue;

                var trimmed = val.Trim();
                if (trimmed.Length > 300)
                {
                    return (false, $"{name} cannot exceed 300 characters.");
                }

                if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var uri) || 
                    (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
                {
                    return (false, $"{name} must be a valid absolute HTTP or HTTPS URL (e.g. https://example.com).");
                }
            }

            return (true, null);
        }

        private static CompanyResponseDto MapToDto(Company c)
        {
            return new CompanyResponseDto
            {
                Id = c.Id,
                EmployerId = c.EmployerId,
                CompanyName = c.CompanyName,
                LogoUrl = c.LogoUrl,
                BannerUrl = c.BannerUrl,
                Description = c.Description,
                Benefits = c.Benefits,
                Website = c.Website,
                LinkedinUrl = c.LinkedinUrl,
                TwitterUrl = c.TwitterUrl,
                FacebookUrl = c.FacebookUrl,
                Industry = c.Industry,
                CompanySize = c.CompanySize,
                Location = c.Location,
                IsApproved = c.IsApproved,
                VerificationStatus = c.VerificationStatus,
                CreatedAt = c.CreatedAt
            };
        }

        private static PublicCompanyResponseDto MapToPublicDto(Company c, string? currentUserId)
        {
            return new PublicCompanyResponseDto
            {
                Id = c.Id,
                CompanyName = c.CompanyName,
                LogoUrl = c.LogoUrl,
                BannerUrl = c.BannerUrl,
                Description = c.Description,
                Benefits = c.Benefits,
                Website = c.Website,
                LinkedinUrl = c.LinkedinUrl,
                TwitterUrl = c.TwitterUrl,
                FacebookUrl = c.FacebookUrl,
                Industry = c.Industry,
                CompanySize = c.CompanySize,
                Location = c.Location,
                IsApproved = c.IsApproved,
                VerificationStatus = c.VerificationStatus,
                CreatedAt = c.CreatedAt,
                IsOwner = currentUserId != null && c.EmployerId == currentUserId
            };
        }
    }

    public class CompanyDto
    {
        public string CompanyName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Benefits { get; set; }
        public string? Industry { get; set; }
        public string? Location { get; set; }
        public string? CompanySize { get; set; }
        public string? Website { get; set; }
        public string? LinkedinUrl { get; set; }
        public string? TwitterUrl { get; set; }
        public string? FacebookUrl { get; set; }
    }

    public class CompanyResponseDto
    {
        public int Id { get; set; }
        public string EmployerId { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public string? BannerUrl { get; set; }
        public string? Description { get; set; }
        public string? Benefits { get; set; }
        public string? Website { get; set; }
        public string? LinkedinUrl { get; set; }
        public string? TwitterUrl { get; set; }
        public string? FacebookUrl { get; set; }
        public string? Industry { get; set; }
        public string? CompanySize { get; set; }
        public string? Location { get; set; }
        public bool IsApproved { get; set; }
        public string VerificationStatus { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class PublicCompanyResponseDto
    {
        public int Id { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public string? BannerUrl { get; set; }
        public string? Description { get; set; }
        public string? Benefits { get; set; }
        public string? Website { get; set; }
        public string? LinkedinUrl { get; set; }
        public string? TwitterUrl { get; set; }
        public string? FacebookUrl { get; set; }
        public string? Industry { get; set; }
        public string? CompanySize { get; set; }
        public string? Location { get; set; }
        public bool IsApproved { get; set; }
        public string VerificationStatus { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool IsOwner { get; set; }
    }
}
