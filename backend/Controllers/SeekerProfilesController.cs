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

        public SeekerProfilesController(AppDbContext context, HireConnect.API.Services.IFileStorageService fileStorage)
        {
            _context = context;
            _fileStorage = fileStorage;
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
        public async Task<IActionResult> UploadResume(IFormFile resumeFile)
        {
            if (resumeFile == null || resumeFile.Length == 0) return BadRequest("No file uploaded.");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var profile = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (profile == null)
            {
                profile = new SeekerProfile { UserId = userId! };
                _context.SeekerProfiles.Add(profile);
            }

            var resumeUrl = await _fileStorage.UploadFileAsync(resumeFile, "resumes");
            profile.ResumeUrl = resumeUrl;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Resume uploaded successfully", resumeUrl });
        }

        [HttpGet("download-resume")]
        public async Task<IActionResult> DownloadResume()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var profile = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);

            if (profile == null || string.IsNullOrEmpty(profile.ResumeUrl)) return NotFound();

            var env = HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>();
            var filePath = Path.Combine(env.WebRootPath ?? env.ContentRootPath, profile.ResumeUrl.TrimStart('/'));

            if (!System.IO.File.Exists(filePath)) return NotFound();

            var provider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(filePath, out var contentType))
            {
                contentType = "application/octet-stream";
            }

            return PhysicalFile(filePath, contentType, Path.GetFileName(filePath));
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
}
