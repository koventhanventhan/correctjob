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
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IResumeExtractorService _extractor;

        public ApplicationsController(AppDbContext context, IFileStorageService fileStorage, IServiceScopeFactory scopeFactory, IResumeExtractorService extractor)
        {
            _context = context;
            _fileStorage = fileStorage;
            _scopeFactory = scopeFactory;
            _extractor = extractor;
        }

        [HttpPost]
        [Authorize(Roles = "JobSeeker")]
        public async Task<IActionResult> Apply([FromForm] ApplicationDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var seeker = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (seeker == null) return BadRequest("Please complete your profile first.");

            var job = await _context.Jobs.Include(j => j.Company).FirstOrDefaultAsync(j => j.Id == model.JobId);
            if (job == null || job.Status != "Published") return NotFound("Job not found or not open for applications.");

            // Prevent duplicate applications
            var hasAlreadyApplied = await _context.Applications.AnyAsync(a => a.JobId == model.JobId && a.SeekerId == seeker.Id);
            if (hasAlreadyApplied)
            {
                return BadRequest(new { message = "You have already applied for this job." });
            }

            // File upload & validation
            string? resumeUrl = seeker.ResumeUrl;
            string? resumeText = seeker.ResumeText;
            
            if (model.SelectedResumeId.HasValue)
            {
                var selectedResume = await _context.SeekerResumes
                    .FirstOrDefaultAsync(r => r.Id == model.SelectedResumeId.Value && r.SeekerId == seeker.Id);
                if (selectedResume != null)
                {
                    resumeUrl = selectedResume.FileUrl;
                    resumeText = selectedResume.ResumeText;
                }
            }
            else if (model.ResumeFile != null)
            {
                if (model.ResumeFile.Length > 5 * 1024 * 1024)
                {
                    return BadRequest(new { message = "Resume file size cannot exceed 5MB." });
                }

                var ext = Path.GetExtension(model.ResumeFile.FileName)?.ToLowerInvariant() ?? "";
                var allowedExts = new[] { ".pdf", ".doc", ".docx" };
                if (!allowedExts.Contains(ext))
                {
                    return BadRequest(new { message = "Only PDF, DOC, and DOCX files are allowed for resume upload." });
                }

                resumeUrl = await _fileStorage.UploadFileAsync(model.ResumeFile, "resumes");
                try
                {
                    using var stream = model.ResumeFile.OpenReadStream();
                    resumeText = await _extractor.ExtractTextAsync(stream, model.ResumeFile.ContentType);
                }
                catch
                {
                    // Fallback to existing or null
                }
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

            var notification = new Notification
            {
                UserId = job.Company.EmployerId,
                Title = "New Job Application",
                Message = $"A new application has been submitted for your job: {job.Title}."
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            // Save screening question answers if present
            if (!string.IsNullOrWhiteSpace(model.AnswersJson))
            {
                try
                {
                    var answers = System.Text.Json.JsonSerializer.Deserialize<List<AnswerInputDto>>(
                        model.AnswersJson,
                        new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                    );
                    if (answers != null && answers.Any())
                    {
                        foreach (var a in answers)
                        {
                            if (!string.IsNullOrWhiteSpace(a.AnswerText))
                            {
                                _context.ApplicationAnswers.Add(new ApplicationAnswer
                                {
                                    ApplicationId = application.Id,
                                    QuestionId = a.QuestionId,
                                    AnswerText = a.AnswerText.Trim()
                                });
                            }
                        }
                        await _context.SaveChangesAsync();
                    }
                }
                catch { }
            }
            
            var appId = application.Id;
            var jobDesc = (job.Description ?? "") + " " + (job.Requirements ?? "") + " " + (job.Responsibilities ?? "");

            // Fire and forget matching
            _ = Task.Run(async () => 
            {
                using var scope = _scopeFactory.CreateScope();
                var matcher = scope.ServiceProvider.GetRequiredService<IResumeMatchingService>();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                
                var (score, explanation) = await matcher.MatchAsync(resumeText, jobDesc);
                
                var appToUpdate = await db.Applications.FindAsync(appId);
                if (appToUpdate != null)
                {
                    appToUpdate.MatchScore = score;
                    appToUpdate.MatchExplanation = explanation;
                    await db.SaveChangesAsync();
                }
            });

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
                .Include(a => a.Answers)
                .ThenInclude(ans => ans.Question)
                .Where(a => a.Seeker.UserId == userId);

            var totalCount = await query.CountAsync();
            var applications = await query
                .OrderByDescending(a => a.AppliedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new { data = applications, totalCount });
        }

        [HttpPost("{id}/withdraw")]
        [Authorize(Roles = "JobSeeker")]
        public async Task<IActionResult> WithdrawApplication(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var seeker = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (seeker == null) return Forbid();

            var application = await _context.Applications
                .Include(a => a.Job)
                .ThenInclude(j => j.Company)
                .FirstOrDefaultAsync(a => a.Id == id && a.SeekerId == seeker.Id);

            if (application == null) return NotFound(new { message = "Application not found." });

            if (application.Status == "Withdrawn")
            {
                return BadRequest(new { message = "Application is already withdrawn." });
            }

            if (application.Status == "Selected" || application.Status == "Hired")
            {
                return BadRequest(new { message = "Cannot withdraw an accepted or hired application directly. Please contact the employer." });
            }

            application.Status = "Withdrawn";
            application.UpdatedAt = DateTime.UtcNow;

            if (application.Job?.Company?.EmployerId != null)
            {
                _context.Notifications.Add(new Notification
                {
                    UserId = application.Job.Company.EmployerId,
                    Title = "Application Withdrawn",
                    Message = $"An applicant has withdrawn their application for '{application.Job.Title}'."
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Application withdrawn successfully." });
        }

        [HttpGet("check/{jobId}")]
        [Authorize(Roles = "JobSeeker")]
        public async Task<IActionResult> CheckApplicationStatus(int jobId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var seeker = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (seeker == null) return Ok(new { isApplied = false });

            var app = await _context.Applications
                .Where(a => a.JobId == jobId && a.SeekerId == seeker.Id)
                .Select(a => new
                {
                    isApplied = true,
                    applicationId = a.Id,
                    status = a.Status,
                    appliedAt = a.AppliedAt
                })
                .FirstOrDefaultAsync();

            if (app == null) return Ok(new { isApplied = false });
            return Ok(app);
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
                .Include(a => a.Answers)
                .ThenInclude(ans => ans.Question)
                .Where(a => a.JobId == jobId)
                .ToListAsync();

            return Ok(applications);
        }

        [HttpGet("employer-stats")]
        [Authorize(Roles = "Employer")]
        public async Task<IActionResult> GetEmployerStats()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.EmployerId == userId);
            if (company == null) return Ok(new { TotalApplications = 0, NewApplications = 0, Interviewing = 0 });

            var stats = await _context.Applications
                .Where(a => a.Job.CompanyId == company.Id)
                .GroupBy(a => 1)
                .Select(g => new
                {
                    TotalApplications = g.Count(),
                    NewApplications = g.Count(a => a.Status == "Applied"),
                    Interviewing = g.Count(a => a.Status == "Shortlisted" || a.Status == "Interview Scheduled")
                })
                .FirstOrDefaultAsync();

            if (stats == null) return Ok(new { TotalApplications = 0, NewApplications = 0, Interviewing = 0 });
            
            return Ok(stats);
        }

        [HttpPatch("{id}/status")]
        [Authorize(Roles = "Employer")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            var application = await _context.Applications
                .Include(a => a.Job)
                .ThenInclude(j => j.Company)
                .Include(a => a.Seeker)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (application == null) return NotFound();
            if (application.Job.Company.EmployerId != userId) return Forbid(); // Ownership check

            if (model.Status == "Interview Scheduled" && !model.InterviewDate.HasValue)
            {
                return BadRequest(new { message = "Interview date is required when scheduling an interview." });
            }

            if (model.Status == "Interview Scheduled" && !string.IsNullOrEmpty(model.MeetingLink))
            {
                if (!Uri.TryCreate(model.MeetingLink, UriKind.Absolute, out Uri? uriResult) 
                    || (uriResult.Scheme != Uri.UriSchemeHttp && uriResult.Scheme != Uri.UriSchemeHttps))
                {
                    return BadRequest(new { message = "Meeting link must be a valid HTTP or HTTPS URL." });
                }
                application.MeetingLink = model.MeetingLink;
            }

            application.Status = model.Status;
            if (!string.IsNullOrEmpty(model.EmployerNotes))
                application.EmployerNotes = model.EmployerNotes;
            
            // Only update InterviewDate if it's provided or if status changed to Interview Scheduled
            if (model.InterviewDate.HasValue)
            {
                application.InterviewDate = model.InterviewDate;
            }

            application.UpdatedAt = DateTime.UtcNow;

            var notification = new Notification
            {
                UserId = application.Seeker.UserId,
                Title = "Application Status Updated",
                Message = $"Your application for {application.Job.Title} at {application.Job.Company.CompanyName} has been updated to: {model.Status}."
            };
            _context.Notifications.Add(notification);

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

            var filePath = _fileStorage.GetPhysicalFilePath(application.ResumeUrl, "resumes");
            if (string.IsNullOrEmpty(filePath) || !System.IO.File.Exists(filePath)) return NotFound();

            var provider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(filePath, out var contentType))
            {
                contentType = "application/octet-stream";
            }

            return PhysicalFile(filePath, contentType, Path.GetFileName(filePath));
        }

        [HttpGet("{id}/calendar.ics")]
        [Authorize(Roles = "JobSeeker")]
        public async Task<IActionResult> DownloadCalendarInvite(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var application = await _context.Applications
                .Include(a => a.Job)
                .ThenInclude(j => j.Company)
                .Include(a => a.Seeker)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (application == null) return NotFound();
            if (application.Seeker.UserId != userId) return Forbid();
            if (application.Status != "Interview Scheduled" || !application.InterviewDate.HasValue)
            {
                return BadRequest(new { message = "No interview scheduled for this application." });
            }

            var startTime = application.InterviewDate.Value.ToUniversalTime();
            var endTime = startTime.AddHours(1); // Default 1 hour duration
            var dtStamp = DateTime.UtcNow.ToString("yyyyMMddTHHmmssZ");
            var dtStart = startTime.ToString("yyyyMMddTHHmmssZ");
            var dtEnd = endTime.ToString("yyyyMMddTHHmmssZ");

            var description = $"You have an interview scheduled for the position of {application.Job.Title} at {application.Job.Company.CompanyName}.";
            var location = "To be decided / Online";

            if (!string.IsNullOrEmpty(application.MeetingLink))
            {
                description += $"\\n\\nMeeting Link: {application.MeetingLink}";
                location = application.MeetingLink;
            }

            var icsContent = $@"BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//HireConnect//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
DTSTAMP:{dtStamp}
DTSTART:{dtStart}
DTEND:{dtEnd}
SUMMARY:Interview for {application.Job.Title} at {application.Job.Company.CompanyName}
DESCRIPTION:{description}
LOCATION:{location}
UID:{Guid.NewGuid()}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Reminder
END:VALARM
END:VEVENT
END:VCALENDAR";

            // Return as a file download
            var bytes = System.Text.Encoding.UTF8.GetBytes(icsContent);
            return File(bytes, "text/calendar", $"Interview_{application.Job.Title.Replace(" ", "_")}.ics");
        }

        [HttpGet("{id}/messages")]
        [Authorize]
        public async Task<IActionResult> GetMessages(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            var application = await _context.Applications
                .Include(a => a.Job)
                .ThenInclude(j => j.Company)
                .Include(a => a.Seeker)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (application == null) return NotFound();

            bool isSeeker = application.Seeker.UserId == userId;
            bool isEmployer = application.Job.Company.EmployerId == userId;

            if (!isSeeker && !isEmployer) return Forbid();

            var messages = await _context.Messages
                .Where(m => m.ApplicationId == id)
                .OrderBy(m => m.SentAt)
                .Select(m => new
                {
                    m.Id,
                    m.ApplicationId,
                    m.SenderId,
                    SenderName = m.Sender.FullName,
                    m.Content,
                    m.SentAt,
                    m.IsRead
                })
                .ToListAsync();

            // Mark unread messages as read
            var unreadMessages = await _context.Messages
                .Where(m => m.ApplicationId == id && m.SenderId != userId && !m.IsRead)
                .ToListAsync();

            if (unreadMessages.Any())
            {
                foreach (var msg in unreadMessages)
                {
                    msg.IsRead = true;
                }
                await _context.SaveChangesAsync();
            }

            return Ok(messages);
        }
    }

    public class ApplicationDto
    {
        public int JobId { get; set; }
        public string? CoverLetter { get; set; }
        public IFormFile? ResumeFile { get; set; }
        public int? SelectedResumeId { get; set; }
        public string? AnswersJson { get; set; }
    }

    public class AnswerInputDto
    {
        public int QuestionId { get; set; }
        public string AnswerText { get; set; } = string.Empty;
    }

    public class UpdateStatusDto
    {
        public string Status { get; set; } = string.Empty;
        public string? EmployerNotes { get; set; }
        public DateTime? InterviewDate { get; set; }
        public string? MeetingLink { get; set; }
    }
}
