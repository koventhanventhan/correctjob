using HireConnect.API.Data;
using HireConnect.API.Models;
using HireConnect.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HireConnect.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ApplicationsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IFileStorageService _fileStorage;

        public ApplicationsController(AppDbContext context, IFileStorageService fileStorage)
        {
            _context = context;
            _fileStorage = fileStorage;
        }

        [HttpPost]
        [Authorize(Roles = "JobSeeker")]
        public async Task<IActionResult> Apply([FromForm] ApplicationDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var seeker = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (seeker == null) return BadRequest("Please complete your profile first.");

            var job = await _context.Jobs.FindAsync(model.JobId);
            if (job == null || job.Status != "Published") return NotFound("Job not found or not open for applications.");

            // File upload
            string? resumeUrl = seeker.ResumeUrl;
            if (model.ResumeFile != null)
            {
                resumeUrl = await _fileStorage.UploadFileAsync(model.ResumeFile, "resumes");
            }

            var application = new Application
            {
                JobId = job.Id,
                SeekerId = seeker.Id,
                CoverLetter = model.CoverLetter,
                ResumeUrl = resumeUrl,
                Status = "Applied"
            };

            _context.Applications.Add(application);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Application submitted successfully", applicationId = application.Id });
        }

        [HttpGet("my-applications")]
        [Authorize(Roles = "JobSeeker")]
        public async Task<IActionResult> GetMyApplications([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var query = _context.Applications
                .Include(a => a.Job)
                .ThenInclude(j => j.Company)
                .Where(a => a.Seeker.UserId == userId);

            var applications = await query
                .OrderByDescending(a => a.AppliedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(applications);
        }

        [HttpGet("job/{jobId}")]
        [Authorize(Roles = "Employer")]
        public async Task<IActionResult> GetJobApplications(int jobId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            var job = await _context.Jobs.Include(j => j.Company).FirstOrDefaultAsync(j => j.Id == jobId);
            if (job == null) return NotFound();
            if (job.Company.EmployerId != userId) return Forbid(); // Ownership check

            var applications = await _context.Applications
                .Include(a => a.Seeker)
                .ThenInclude(s => s.User)
                .Where(a => a.JobId == jobId)
                .ToListAsync();

            return Ok(applications);
        }

        [HttpPatch("{id}/status")]
        [Authorize(Roles = "Employer")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            var application = await _context.Applications
                .Include(a => a.Job)
                .ThenInclude(j => j.Company)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (application == null) return NotFound();
            if (application.Job.Company.EmployerId != userId) return Forbid(); // Ownership check

            application.Status = model.Status;
            if (!string.IsNullOrEmpty(model.EmployerNotes))
                application.EmployerNotes = model.EmployerNotes;
            if (model.InterviewDate.HasValue)
                application.InterviewDate = model.InterviewDate;

            application.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(application);
        }

        // Resume access control endpoint
        [HttpGet("download-resume/{id}")]
        [Authorize]
        public async Task<IActionResult> DownloadResume(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");

            var application = await _context.Applications
                .Include(a => a.Job)
                .ThenInclude(j => j.Company)
                .Include(a => a.Seeker)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (application == null || string.IsNullOrEmpty(application.ResumeUrl)) return NotFound();

            bool isOwner = application.Seeker.UserId == userId;
            bool isEmployer = application.Job.Company.EmployerId == userId;

            if (!isAdmin && !isOwner && !isEmployer) return Forbid(); // Access control check

            var env = HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>();
            var filePath = Path.Combine(env.WebRootPath ?? env.ContentRootPath, application.ResumeUrl.TrimStart('/'));

            if (!System.IO.File.Exists(filePath)) return NotFound();

            var provider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(filePath, out var contentType))
            {
                contentType = "application/octet-stream";
            }

            return PhysicalFile(filePath, contentType, Path.GetFileName(filePath));
        }
    }

    public class ApplicationDto
    {
        public int JobId { get; set; }
        public string? CoverLetter { get; set; }
        public IFormFile? ResumeFile { get; set; }
    }

    public class UpdateStatusDto
    {
        public string Status { get; set; } = string.Empty;
        public string? EmployerNotes { get; set; }
        public DateTime? InterviewDate { get; set; }
    }
}
