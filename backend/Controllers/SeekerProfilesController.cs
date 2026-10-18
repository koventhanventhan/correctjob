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
    [Authorize(Roles = "JobSeeker")]
    public class SeekerProfilesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly HireConnect.API.Services.IFileStorageService _fileStorage;
        private readonly HireConnect.API.Services.IResumeExtractorService _extractor;

        public SeekerProfilesController(AppDbContext context, HireConnect.API.Services.IFileStorageService fileStorage, HireConnect.API.Services.IResumeExtractorService extractor)
        {
            _context = context;
            _fileStorage = fileStorage;
            _extractor = extractor;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var profile = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            
            if (profile == null)
            {
                // Return an empty profile if not yet created, or 404
                return Ok(new { });
            }

            return Ok(profile);
        }

        [HttpPut("me")]
        public async Task<IActionResult> UpdateProfile([FromBody] SeekerProfileDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var existing = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);

            if (existing == null)
            {
                // Create
                existing = new SeekerProfile { UserId = userId! };
                _context.SeekerProfiles.Add(existing);
            }

            existing.CareerTitle = model.CareerTitle;
            existing.Bio = model.Bio;
            existing.Experience = model.Experience;
            existing.Education = model.Education;
            existing.Location = model.Location;
            existing.LinkedInUrl = model.LinkedInUrl;
            existing.PortfolioUrl = model.PortfolioUrl;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }
        
        [HttpPost("resume")]
        [RequestSizeLimit(5242880)] // 5 MB limit
        public async Task<IActionResult> UploadResume(IFormFile resumeFile)
        {
            if (resumeFile == null || resumeFile.Length == 0) return BadRequest("No file uploaded.");

            // 1. Validate file size (max 5 MB)
            const long maxFileSize = 5 * 1024 * 1024;
            if (resumeFile.Length > maxFileSize)
            {
                return BadRequest("File size exceeds the 5 MB limit.");
            }

            // 2. Validate file type
            var allowedContentTypes = new[]
            {
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            };

            if (!allowedContentTypes.Contains(resumeFile.ContentType))
            {
                return BadRequest("Invalid file type. Only PDF and Word documents are allowed.");
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var profile = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (profile == null)
            {
                profile = new SeekerProfile { UserId = userId! };
                _context.SeekerProfiles.Add(profile);
            }

            var resumeUrl = await _fileStorage.UploadFileAsync(resumeFile, "resumes");
            profile.ResumeUrl = resumeUrl;
            
            try
            {
                using var stream = resumeFile.OpenReadStream();
                var text = await _extractor.ExtractTextAsync(stream, resumeFile.ContentType);
                profile.ResumeText = text;
            }
            catch
            {
                profile.ResumeText = null;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Resume uploaded successfully", resumeUrl });
        }

        [HttpGet("download-resume")]
        public async Task<IActionResult> DownloadResume()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var profile = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);

            if (profile == null || string.IsNullOrEmpty(profile.ResumeUrl)) return NotFound();

            var filePath = _fileStorage.GetPhysicalFilePath(profile.ResumeUrl, "resumes");
            if (string.IsNullOrEmpty(filePath) || !System.IO.File.Exists(filePath)) return NotFound();

            var provider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(filePath, out var contentType))
            {
                contentType = "application/octet-stream";
            }

            return PhysicalFile(filePath, contentType, Path.GetFileName(filePath));
        }

        [HttpPost("verify-identity")]
        [RequestSizeLimit(10485760)] // 10 MB total
        public async Task<IActionResult> UploadIdCard(IFormFile front, IFormFile? back)
        {
            if (front == null || front.Length == 0) return BadRequest("Front ID card is required.");

            const long maxFileSize = 5 * 1024 * 1024;
            var allowedContentTypes = new[] { "image/jpeg", "image/png", "application/pdf" };

            if (front.Length > maxFileSize) return BadRequest("Front ID card exceeds 5MB.");
            if (!allowedContentTypes.Contains(front.ContentType)) return BadRequest("Invalid file type for front ID.");

            if (back != null)
            {
                if (back.Length > maxFileSize) return BadRequest("Back ID card exceeds 5MB.");
                if (!allowedContentTypes.Contains(back.ContentType)) return BadRequest("Invalid file type for back ID.");
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var profile = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (profile == null)
            {
                profile = new SeekerProfile { UserId = userId! };
                _context.SeekerProfiles.Add(profile);
            }

            profile.IdCardFrontUrl = await _fileStorage.UploadFileAsync(front, "id-cards");

            if (back != null)
            {
                profile.IdCardBackUrl = await _fileStorage.UploadFileAsync(back, "id-cards");
            }

            profile.VerificationStatus = "Pending";
            profile.VerificationNotes = null;

            await _context.SaveChangesAsync();
            return Ok(new { message = "ID card uploaded successfully", status = profile.VerificationStatus });
        }

        [HttpGet("id-card/{side}")]
        [AllowAnonymous] // We handle custom auth inside
        public async Task<IActionResult> DownloadIdCard(string side, [FromQuery] int? profileId = null)
        {
            if (!User.Identity?.IsAuthenticated ?? true) return Unauthorized();

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");

            SeekerProfile? profile;

            if (isAdmin && profileId.HasValue)
            {
                profile = await _context.SeekerProfiles.FindAsync(profileId.Value);
            }
            else
            {
                profile = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            }

            if (profile == null) return NotFound();

            if (!isAdmin && profile.UserId != userId) return Forbid();

            var fileUrl = side.ToLower() == "back" ? profile.IdCardBackUrl : profile.IdCardFrontUrl;
            if (string.IsNullOrEmpty(fileUrl)) return NotFound();

            var filePath = _fileStorage.GetPhysicalFilePath(fileUrl, "id-cards");
            if (string.IsNullOrEmpty(filePath) || !System.IO.File.Exists(filePath)) return NotFound();

            var provider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(filePath, out var contentType))
            {
                contentType = "application/octet-stream";
            }

            return PhysicalFile(filePath, contentType, Path.GetFileName(filePath));
        }

        [HttpGet("resumes")]
        public async Task<IActionResult> GetMyResumes()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var seeker = await _context.SeekerProfiles
                .Include(s => s.Resumes)
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (seeker == null) return Ok(new List<object>());

            var resumes = seeker.Resumes
                .OrderByDescending(r => r.IsDefault)
                .ThenByDescending(r => r.UploadedAt)
                .Select(r => new
                {
                    r.Id,
                    r.Title,
                    r.FileUrl,
                    r.FileName,
                    r.IsDefault,
                    r.UploadedAt
                })
                .ToList();

            return Ok(resumes);
        }

        [HttpPost("resumes")]
        [RequestSizeLimit(5242880)] // 5 MB
        public async Task<IActionResult> AddResume([FromForm] AddResumeDto model)
        {
            if (model.File == null || model.File.Length == 0) return BadRequest("File is required.");
            if (model.File.Length > 5 * 1024 * 1024) return BadRequest("File size cannot exceed 5MB.");

            var ext = Path.GetExtension(model.File.FileName)?.ToLowerInvariant();
            var allowedExts = new[] { ".pdf", ".doc", ".docx" };
            if (!allowedExts.Contains(ext)) return BadRequest("Only PDF and Word documents are supported.");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var seeker = await _context.SeekerProfiles.Include(s => s.Resumes).FirstOrDefaultAsync(s => s.UserId == userId);
            if (seeker == null)
            {
                seeker = new SeekerProfile { UserId = userId! };
                _context.SeekerProfiles.Add(seeker);
                await _context.SaveChangesAsync();
            }

            var fileUrl = await _fileStorage.UploadFileAsync(model.File, "resumes");
            string? extractedText = null;
            try
            {
                using var stream = model.File.OpenReadStream();
                extractedText = await _extractor.ExtractTextAsync(stream, model.File.ContentType);
            }
            catch { }

            bool isDefault = model.IsDefault || seeker.Resumes.Count == 0;
            if (isDefault)
            {
                foreach (var r in seeker.Resumes) r.IsDefault = false;
                seeker.ResumeUrl = fileUrl;
                seeker.ResumeText = extractedText;
            }

            var resume = new SeekerResume
            {
                SeekerId = seeker.Id,
                Title = !string.IsNullOrWhiteSpace(model.Title) ? model.Title.Trim() : model.File.FileName,
                FileName = model.File.FileName,
                FileUrl = fileUrl,
                ResumeText = extractedText,
                IsDefault = isDefault,
                UploadedAt = DateTime.UtcNow
            };

            _context.SeekerResumes.Add(resume);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                resume.Id,
                resume.Title,
                resume.FileUrl,
                resume.FileName,
                resume.IsDefault,
                resume.UploadedAt
            });
        }

        [HttpDelete("resumes/{id}")]
        public async Task<IActionResult> DeleteResume(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var seeker = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (seeker == null) return NotFound();

            var resume = await _context.SeekerResumes.FirstOrDefaultAsync(r => r.Id == id && r.SeekerId == seeker.Id);
            if (resume == null) return NotFound();

            await _fileStorage.DeleteFileAsync(resume.FileUrl);
            _context.SeekerResumes.Remove(resume);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Resume deleted successfully." });
        }

        [HttpPut("resumes/{id}/default")]
        public async Task<IActionResult> SetDefaultResume(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var seeker = await _context.SeekerProfiles
                .Include(s => s.Resumes)
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (seeker == null) return NotFound();

            var resume = seeker.Resumes.FirstOrDefault(r => r.Id == id);
            if (resume == null) return NotFound();

            foreach (var r in seeker.Resumes)
            {
                r.IsDefault = (r.Id == id);
            }

            seeker.ResumeUrl = resume.FileUrl;
            seeker.ResumeText = resume.ResumeText;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Default resume updated." });
        }
    }

    public class SeekerProfileDto
    {
        public string? CareerTitle { get; set; }
        public string? Bio { get; set; }
        public string? Experience { get; set; }
        public string? Education { get; set; }
        public string? Location { get; set; }
        public string? LinkedInUrl { get; set; }
        public string? PortfolioUrl { get; set; }
    }

    public class AddResumeDto
    {
        public string? Title { get; set; }
        public IFormFile File { get; set; } = null!;
        public bool IsDefault { get; set; } = false;
    }
}
