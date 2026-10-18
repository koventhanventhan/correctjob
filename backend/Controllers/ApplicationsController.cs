using HireConnect.API.Data;
using HireConnect.API.Models;
using HireConnect.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
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

        public static readonly string[] AllowedStatuses = { "Applied", "Viewed", "Shortlisted", "Interview", "Hired", "Rejected", "Withdrawn" };

        private static string NormalizeStatus(string? status)
        {
            var trimmed = status?.Trim() ?? string.Empty;
            if (string.Equals(trimmed, "Under Review", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(trimmed, "UnderReview", StringComparison.OrdinalIgnoreCase))
                return "Viewed";
            if (string.Equals(trimmed, "Interview Scheduled", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(trimmed, "InterviewScheduled", StringComparison.OrdinalIgnoreCase))
                return "Interview";
            if (string.Equals(trimmed, "Selected", StringComparison.OrdinalIgnoreCase))
                return "Hired";

            return AllowedStatuses.FirstOrDefault(s => string.Equals(s, trimmed, StringComparison.OrdinalIgnoreCase)) ?? trimmed;
        }

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

            // 1. Fetch Job's screening questions
            var jobQuestions = await _context.JobScreeningQuestions
                .Where(q => q.JobId == job.Id)
                .ToListAsync();

            // 2. Parse candidate's submitted answers
            var answers = new List<AnswerInputDto>();
            if (!string.IsNullOrWhiteSpace(model.AnswersJson))
            {
                try
                {
                    var parsed = System.Text.Json.JsonSerializer.Deserialize<List<AnswerInputDto>>(
                        model.AnswersJson,
                        new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                    );
                    if (parsed != null)
                    {
                        answers = parsed;
                    }
                }
                catch
                {
                    return BadRequest(new { message = "Invalid answers JSON format." });
                }
            }

            // (2) Validate QuestionId: Answer oda QuestionId antha job ku sondhamaanathaa nu check pannu
            var jobQuestionIds = jobQuestions.Select(q => q.Id).ToHashSet();
            foreach (var a in answers)
            {
                if (!jobQuestionIds.Contains(a.QuestionId))
                {
                    return BadRequest(new { message = $"Screening question ID {a.QuestionId} does not belong to this job." });
                }

                var q = jobQuestions.First(x => x.Id == a.QuestionId);
                if (!string.IsNullOrWhiteSpace(a.AnswerText))
                {
                    var trimmed = a.AnswerText.Trim();
                    if (q.QuestionType.Equals("Number", StringComparison.OrdinalIgnoreCase))
                    {
                        if (!double.TryParse(trimmed, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out _))
                        {
                            return BadRequest(new { message = $"Answer for screening question \"{q.QuestionText}\" must be a valid number." });
                        }
                    }
                    else if (q.QuestionType.Equals("YesNo", StringComparison.OrdinalIgnoreCase))
                    {
                        if (!trimmed.Equals("Yes", StringComparison.OrdinalIgnoreCase) && !trimmed.Equals("No", StringComparison.OrdinalIgnoreCase))
                        {
                            return BadRequest(new { message = $"Answer for screening question \"{q.QuestionText}\" must be either 'Yes' or 'No'." });
                        }
                        a.AnswerText = trimmed.Equals("Yes", StringComparison.OrdinalIgnoreCase) ? "Yes" : "No";
                    }
                    else if (q.QuestionType.Equals("Text", StringComparison.OrdinalIgnoreCase))
                    {
                        if (trimmed.Length > 1000)
                        {
                            return BadRequest(new { message = $"Answer for screening question \"{q.QuestionText}\" cannot exceed 1000 characters." });
                        }
                    }
                }
            }

            // (1) Validate IsRequired: antha job oda IsRequired=true screening questions ku bathil irukkanum, illana 400
            foreach (var q in jobQuestions.Where(q => q.IsRequired))
            {
                var candidateAnswer = answers.FirstOrDefault(a => a.QuestionId == q.Id);
                if (candidateAnswer == null || string.IsNullOrWhiteSpace(candidateAnswer.AnswerText))
                {
                    return BadRequest(new { message = $"Please answer the required screening question: \"{q.QuestionText}\"" });
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

            // Save screening question answers
            if (answers.Any())
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
                .Select(a => new
                {
                    a.Id,
                    a.JobId,
                    a.SeekerId,
                    a.Status,
                    a.Rating,
                    a.CoverLetter,
                    a.ResumeUrl,
                    a.MatchScore,
                    a.MatchExplanation,
                    a.AppliedAt,
                    a.UpdatedAt,
                    a.InterviewDate,
                    a.MeetingLink,
                    Job = a.Job == null ? null : new
                    {
                        a.Job.Id,
                        a.Job.Title,
                        a.Job.Location,
                        a.Job.JobType,
                        a.Job.Status,
                        a.Job.SalaryMin,
                        a.Job.SalaryMax,
                        Company = a.Job.Company == null ? null : new
                        {
                            a.Job.Company.Id,
                            a.Job.Company.CompanyName,
                            a.Job.Company.LogoUrl,
                            a.Job.Company.Location,
                            a.Job.Company.Industry,
                            a.Job.Company.Website
                        }
                    },
                    Answers = a.Answers.Select(ans => new
                    {
                        ans.Id,
                        ans.QuestionId,
                        ans.AnswerText,
                        Question = ans.Question == null ? null : new
                        {
                            ans.Question.Id,
                            ans.Question.QuestionText,
                            ans.Question.QuestionType,
                            ans.Question.IdealAnswer
                        }
                    }).ToList()
                })
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
                .Include(a => a.Seeker.Skills)
                .Include(a => a.Answers)
                .ThenInclude(ans => ans.Question)
                .Where(a => a.JobId == jobId)
                .OrderByDescending(a => a.AppliedAt)
                .ToListAsync();

            var responseList = applications.Select(a => MapToEmployerApplicationDto(a)).ToList();
            return Ok(responseList);
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetApplication(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");

            var application = await _context.Applications
                .Include(a => a.Job)
                .ThenInclude(j => j.Company)
                .Include(a => a.Seeker)
                .ThenInclude(s => s.User)
                .Include(a => a.Seeker.Skills)
                .Include(a => a.Answers)
                .ThenInclude(ans => ans.Question)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (application == null) return NotFound();

            bool isSeeker = application.Seeker.UserId == userId;
            bool isEmployer = application.Job.Company.EmployerId == userId;

            if (!isAdmin && !isSeeker && !isEmployer) return Forbid();

            // Auto-set "Viewed" when employer opens an application that is currently "Applied"
            if (isEmployer && application.Status == "Applied")
            {
                application.Status = "Viewed";
                application.UpdatedAt = DateTime.UtcNow;

                _context.Notifications.Add(new Notification
                {
                    UserId = application.Seeker.UserId,
                    Title = "Application Viewed",
                    Message = $"Your application for '{application.Job.Title}' at {application.Job.Company.CompanyName} has been viewed by the employer."
                });

                await _context.SaveChangesAsync();
            }

            return Ok(MapToEmployerApplicationDto(application));
        }

        private static object MapToEmployerApplicationDto(Application a)
        {
            return new
            {
                a.Id,
                a.JobId,
                a.SeekerId,
                a.Status,
                a.Rating,
                a.EmployerNotes,
                a.CoverLetter,
                a.ResumeUrl,
                a.MatchScore,
                a.MatchExplanation,
                a.AppliedAt,
                a.UpdatedAt,
                a.InterviewDate,
                a.MeetingLink,
                Seeker = a.Seeker == null ? null : new
                {
                    a.Seeker.Id,
                    a.Seeker.CareerTitle,
                    a.Seeker.Location,
                    a.Seeker.ResumeUrl,
                    a.Seeker.VerificationStatus,
                    Skills = a.Seeker.Skills?.Select(s => s.SkillName).ToList() ?? new List<string>(),
                    User = a.Seeker.User == null ? null : new
                    {
                        a.Seeker.User.FullName,
                        a.Seeker.User.Email,
                        a.Seeker.User.PhoneNumber
                    }
                },
                Answers = (a.Answers ?? Enumerable.Empty<ApplicationAnswer>()).Select(ans => new
                {
                    ans.Id,
                    ans.QuestionId,
                    ans.AnswerText,
                    Question = ans.Question == null ? null : new
                    {
                        ans.Question.Id,
                        ans.Question.QuestionText,
                        ans.Question.QuestionType,
                        ans.Question.IdealAnswer
                    }
                }).ToList()
            };
        }

        [HttpPost("{id}/mark-viewed")]
        [Authorize(Roles = "Employer")]
        public async Task<IActionResult> MarkApplicationViewed(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var application = await _context.Applications
                .Include(a => a.Job)
                .ThenInclude(j => j.Company)
                .Include(a => a.Seeker)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (application == null) return NotFound();
            if (application.Job.Company.EmployerId != userId) return Forbid();

            if (application.Status == "Applied")
            {
                application.Status = "Viewed";
                application.UpdatedAt = DateTime.UtcNow;

                _context.Notifications.Add(new Notification
                {
                    UserId = application.Seeker.UserId,
                    Title = "Application Viewed",
                    Message = $"Your application for '{application.Job.Title}' at {application.Job.Company.CompanyName} has been viewed by the employer."
                });

                await _context.SaveChangesAsync();
                return Ok(new { message = "Application marked as viewed.", status = application.Status });
            }

            return Ok(new { message = "Application already processed.", status = application.Status });
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
                    Interviewing = g.Count(a => a.Status == "Shortlisted" || a.Status == "Interview" || a.Status == "Interview Scheduled")
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

            var targetStatus = NormalizeStatus(model.Status);
            if (!AllowedStatuses.Contains(targetStatus))
            {
                return BadRequest(new { message = $"Invalid status '{model.Status}'. Allowed statuses are: {string.Join(", ", AllowedStatuses)}" });
            }

            if (targetStatus == "Withdrawn")
            {
                return BadRequest(new { message = "Employers cannot set application status to Withdrawn." });
            }

            // Cannot modify a withdrawn application
            if (application.Status == "Withdrawn")
            {
                return BadRequest(new { message = "Cannot change the status of a withdrawn application." });
            }

            // Transition validation: confirm required when changing from Hired or Rejected
            if ((application.Status == "Hired" || application.Status == "Rejected") && application.Status != targetStatus && !model.ConfirmTransition)
            {
                return BadRequest(new
                {
                    message = $"Application is currently '{application.Status}'. Please confirm to change its status to '{targetStatus}'.",
                    requiresConfirmation = true
                });
            }

            if (targetStatus == "Interview")
            {
                var effectiveDate = model.InterviewDate ?? application.InterviewDate;
                if (!effectiveDate.HasValue)
                {
                    return BadRequest(new { message = "Interview date and time is required when scheduling an interview." });
                }

                // Disallow past dates (allow 2-minute buffer for network latency)
                if (model.InterviewDate.HasValue && model.InterviewDate.Value < DateTime.UtcNow.AddMinutes(-2))
                {
                    return BadRequest(new { message = "Interview date and time cannot be in the past." });
                }

                var effectiveLink = !string.IsNullOrWhiteSpace(model.MeetingLink) ? model.MeetingLink.Trim() : application.MeetingLink?.Trim();
                if (string.IsNullOrWhiteSpace(effectiveLink))
                {
                    return BadRequest(new { message = "Meeting link is required when scheduling an interview." });
                }

                if (effectiveLink.Length > 2000)
                {
                    return BadRequest(new { message = "Meeting link cannot exceed 2000 characters." });
                }

                // XSS and safe URI validation
                if (effectiveLink.Contains('<') || effectiveLink.Contains('>') || effectiveLink.Contains('"') || effectiveLink.Contains('\'') || effectiveLink.Contains('`'))
                {
                    return BadRequest(new { message = "Meeting link contains invalid or unsafe characters." });
                }

                if (!Uri.TryCreate(effectiveLink, UriKind.Absolute, out Uri? uriResult) 
                    || (uriResult.Scheme != Uri.UriSchemeHttp && uriResult.Scheme != Uri.UriSchemeHttps))
                {
                    return BadRequest(new { message = "Meeting link must be a valid HTTP or HTTPS URL." });
                }

                application.InterviewDate = effectiveDate;
                application.MeetingLink = effectiveLink;
            }

            if (model.Rating.HasValue)
            {
                if (model.Rating.Value < 1 || model.Rating.Value > 5)
                {
                    return BadRequest(new { message = "Rating must be between 1 and 5." });
                }
                application.Rating = model.Rating.Value;
            }

            if (model.EmployerNotes != null)
            {
                application.EmployerNotes = model.EmployerNotes;
            }

            if (model.InterviewDate.HasValue && targetStatus != "Interview")
            {
                application.InterviewDate = model.InterviewDate;
            }

            var previousStatus = application.Status;
            var isInterviewDetailsChanged = targetStatus == "Interview" && (model.InterviewDate.HasValue || !string.IsNullOrWhiteSpace(model.MeetingLink));

            application.Status = targetStatus;
            application.UpdatedAt = DateTime.UtcNow;

            if (previousStatus != targetStatus || (previousStatus == "Interview" && isInterviewDetailsChanged))
            {
                if (targetStatus == "Interview" && application.InterviewDate.HasValue)
                {
                    var interviewDateUtc = application.InterviewDate.Value.ToUniversalTime();
                    var formattedDate = interviewDateUtc.ToString("dd MMM yyyy");
                    var formattedTime = interviewDateUtc.ToString("hh:mm tt");
                    
                    var notifTitle = previousStatus == "Interview" && !string.Equals(previousStatus, targetStatus, StringComparison.OrdinalIgnoreCase) 
                        ? "Interview Scheduled" 
                        : (previousStatus == "Interview" ? "Interview Details Updated" : "Interview Scheduled");
                    
                    var notifMessage = $"Your interview for {application.Job.Title} at {application.Job.Company.CompanyName} has been scheduled for {formattedDate} at {formattedTime} UTC. Meeting Link: {application.MeetingLink}";

                    _context.Notifications.Add(new Notification
                    {
                        UserId = application.Seeker.UserId,
                        Title = notifTitle,
                        Message = notifMessage
                    });
                }
                else
                {
                    _context.Notifications.Add(new Notification
                    {
                        UserId = application.Seeker.UserId,
                        Title = "Application Status Updated",
                        Message = $"Your application for {application.Job.Title} at {application.Job.Company.CompanyName} has been updated to: {targetStatus}."
                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new
            {
                id = application.Id,
                jobId = application.JobId,
                seekerId = application.SeekerId,
                status = application.Status,
                rating = application.Rating,
                employerNotes = application.EmployerNotes,
                interviewDate = application.InterviewDate,
                meetingLink = application.MeetingLink,
                updatedAt = application.UpdatedAt,
                message = "Application status updated successfully."
            });
        }

        [HttpPatch("{id}/rating")]
        [Authorize(Roles = "Employer")]
        public async Task<IActionResult> UpdateRating(int id, [FromBody] UpdateRatingDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var application = await _context.Applications
                .Include(a => a.Job)
                .ThenInclude(j => j.Company)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (application == null) return NotFound();
            if (application.Job.Company.EmployerId != userId) return Forbid();

            if (model.Rating.HasValue && (model.Rating.Value < 1 || model.Rating.Value > 5))
            {
                return BadRequest(new { message = "Rating must be between 1 and 5." });
            }

            application.Rating = model.Rating;
            application.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { id = application.Id, rating = application.Rating });
        }

        [HttpPatch("{id}/notes")]
        [Authorize(Roles = "Employer")]
        public async Task<IActionResult> UpdateNotes(int id, [FromBody] UpdateNotesDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var application = await _context.Applications
                .Include(a => a.Job)
                .ThenInclude(j => j.Company)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (application == null) return NotFound();
            if (application.Job.Company.EmployerId != userId) return Forbid();

            application.EmployerNotes = model.EmployerNotes;
            application.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { id = application.Id, notes = application.EmployerNotes });
        }

        [HttpPost("bulk-status")]
        [Authorize(Roles = "Employer")]
        public async Task<IActionResult> BulkUpdateStatus([FromBody] BulkStatusDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (model.ApplicationIds == null || model.ApplicationIds.Count == 0)
            {
                return BadRequest(new { message = "No application IDs provided." });
            }

            if (model.ApplicationIds.Count > 100)
            {
                return BadRequest(new { message = "A maximum of 100 applications can be updated in a single bulk request." });
            }

            var targetStatus = NormalizeStatus(model.Status);
            if (!AllowedStatuses.Contains(targetStatus) || targetStatus == "Withdrawn")
            {
                return BadRequest(new { message = $"Invalid target status '{model.Status}'. Allowed bulk statuses are: Shortlisted, Rejected, Viewed, Interview, Hired." });
            }

            var applications = await _context.Applications
                .Include(a => a.Job)
                .ThenInclude(j => j.Company)
                .Include(a => a.Seeker)
                .Where(a => model.ApplicationIds.Contains(a.Id))
                .ToListAsync();

            // Ownership check: every application must belong to a job owned by this employer
            var unauthorized = applications.Where(a => a.Job.Company.EmployerId != userId).ToList();
            if (unauthorized.Any())
            {
                return Forbid();
            }

            var updatedIds = new List<int>();
            var skippedList = new List<object>();

            var existingIds = applications.Select(a => a.Id).ToHashSet();
            var missingIds = model.ApplicationIds.Where(id => !existingIds.Contains(id)).Distinct().ToList();
            foreach (var missingId in missingIds)
            {
                skippedList.Add(new
                {
                    applicationId = missingId,
                    currentStatus = "NotFound",
                    reason = "Application ID not found."
                });
            }

            foreach (var app in applications)
            {
                // 1. Never update Withdrawn applications
                if (app.Status == "Withdrawn")
                {
                    skippedList.Add(new
                    {
                        applicationId = app.Id,
                        currentStatus = app.Status,
                        reason = "Application was withdrawn by candidate and cannot be updated."
                    });
                    continue;
                }

                // 2. If already in target status, skip
                if (app.Status == targetStatus)
                {
                    skippedList.Add(new
                    {
                        applicationId = app.Id,
                        currentStatus = app.Status,
                        reason = $"Application is already in '{targetStatus}' status."
                    });
                    continue;
                }

                // 3. Regress check: Shortlisted/Interview/Hired cannot regress to Viewed/Applied
                if ((app.Status == "Shortlisted" || app.Status == "Interview" || app.Status == "Hired") &&
                    (targetStatus == "Viewed" || targetStatus == "Applied"))
                {
                    skippedList.Add(new
                    {
                        applicationId = app.Id,
                        currentStatus = app.Status,
                        reason = $"Cannot regress application status from '{app.Status}' to '{targetStatus}'."
                    });
                    continue;
                }

                // 4. Transition validation: changing away from Hired or Rejected requires confirmTransition=true
                if ((app.Status == "Hired" || app.Status == "Rejected") && !model.ConfirmTransition)
                {
                    skippedList.Add(new
                    {
                        applicationId = app.Id,
                        currentStatus = app.Status,
                        reason = $"Application is currently '{app.Status}'. Changing away from Hired/Rejected requires confirmTransition=true."
                    });
                    continue;
                }

                app.Status = targetStatus;
                if (!string.IsNullOrWhiteSpace(model.EmployerNotes))
                {
                    app.EmployerNotes = model.EmployerNotes;
                }
                app.UpdatedAt = DateTime.UtcNow;

                _context.Notifications.Add(new Notification
                {
                    UserId = app.Seeker.UserId,
                    Title = "Application Status Updated",
                    Message = $"Your application for {app.Job.Title} at {app.Job.Company.CompanyName} has been updated to: {targetStatus}."
                });

                updatedIds.Add(app.Id);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                updatedCount = updatedIds.Count,
                updatedIds,
                skippedCount = skippedList.Count,
                skipped = skippedList,
                message = $"Successfully updated {updatedIds.Count} applications to '{targetStatus}'." + (skippedList.Count > 0 ? $" {skippedList.Count} application(s) were skipped." : "")
            });
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
            if ((application.Status != "Interview" && application.Status != "Interview Scheduled") || !application.InterviewDate.HasValue)
            {
                return BadRequest(new { message = "No interview scheduled for this application." });
            }

            var startTime = application.InterviewDate.Value.ToUniversalTime();
            var endTime = startTime.AddHours(1); // Default 1 hour duration
            var dtStamp = DateTime.UtcNow.ToString("yyyyMMddTHHmmssZ");
            var dtStart = startTime.ToString("yyyyMMddTHHmmssZ");
            var dtEnd = endTime.ToString("yyyyMMddTHHmmssZ");

            var cleanJobTitle = StripCrLf(application.Job.Title);
            var cleanCompanyName = StripCrLf(application.Job.Company.CompanyName);
            var summary = $"Interview: {cleanJobTitle} at {cleanCompanyName}";
            var description = $"You have an interview scheduled for the position of {cleanJobTitle} at {cleanCompanyName}.";
            var location = "Online";

            if (!string.IsNullOrWhiteSpace(application.MeetingLink))
            {
                var cleanLink = StripCrLf(application.MeetingLink);
                description += $"\n\nMeeting Link: {cleanLink}";
                location = cleanLink;
            }

            var lines = new List<string>
            {
                "BEGIN:VCALENDAR",
                "VERSION:2.0",
                "PRODID:-//HireConnect//EN",
                "CALSCALE:GREGORIAN",
                "METHOD:REQUEST",
                "BEGIN:VEVENT",
                $"DTSTAMP:{dtStamp}",
                $"DTSTART:{dtStart}",
                $"DTEND:{dtEnd}",
                $"SUMMARY:{EscapeIcsText(summary)}",
                $"DESCRIPTION:{EscapeIcsText(description)}",
                $"LOCATION:{EscapeIcsText(location)}",
                $"UID:{Guid.NewGuid()}@hireconnect.com",
                "STATUS:CONFIRMED",
                "SEQUENCE:0",
                "BEGIN:VALARM",
                "TRIGGER:-PT15M",
                "ACTION:DISPLAY",
                "DESCRIPTION:Reminder",
                "END:VALARM",
                "END:VEVENT",
                "END:VCALENDAR"
            };

            var icsContent = string.Join("\r\n", lines.Select(FoldIcsLine)) + "\r\n";
            var bytes = System.Text.Encoding.UTF8.GetBytes(icsContent);

            var safeTitle = System.Text.RegularExpressions.Regex.Replace(cleanJobTitle, @"[^a-zA-Z0-9_\-]", "_");
            safeTitle = System.Text.RegularExpressions.Regex.Replace(safeTitle, @"_+", "_").Trim('_');
            if (string.IsNullOrEmpty(safeTitle)) safeTitle = "Job";
            if (safeTitle.Length > 50) safeTitle = safeTitle.Substring(0, 50).TrimEnd('_');
            var safeFileName = $"Interview_{safeTitle}.ics";

            return File(bytes, "text/calendar; charset=utf-8", safeFileName);
        }

        private static string StripCrLf(string? text)
        {
            if (string.IsNullOrEmpty(text)) return string.Empty;
            return text.Replace("\r", "").Replace("\n", " ").Trim();
        }

        private static string EscapeIcsText(string? text)
        {
            if (string.IsNullOrEmpty(text)) return string.Empty;
            return text
                .Replace("\\", "\\\\")
                .Replace(";", "\\;")
                .Replace(",", "\\,")
                .Replace("\r\n", "\\n")
                .Replace("\n", "\\n")
                .Replace("\r", "\\n");
        }

        private static string FoldIcsLine(string line)
        {
            if (string.IsNullOrEmpty(line)) return string.Empty;
            var utf8 = System.Text.Encoding.UTF8;
            var lineBytes = utf8.GetBytes(line);
            if (lineBytes.Length <= 75)
            {
                return line;
            }

            var sb = new System.Text.StringBuilder();
            int charIndex = 0;
            bool isFirstLine = true;

            while (charIndex < line.Length)
            {
                int maxBytes = isFirstLine ? 75 : 74;
                int nextChar = charIndex;
                int byteAccum = 0;

                while (nextChar < line.Length)
                {
                    int charByteCount = utf8.GetByteCount(line.Substring(nextChar, 1));
                    if (byteAccum + charByteCount > maxBytes)
                    {
                        break;
                    }
                    byteAccum += charByteCount;
                    nextChar++;
                }

                if (nextChar == charIndex)
                {
                    nextChar++;
                }

                var chunk = line.Substring(charIndex, nextChar - charIndex);
                if (!isFirstLine)
                {
                    sb.Append("\r\n ");
                }
                sb.Append(chunk);

                charIndex = nextChar;
                isFirstLine = false;
            }

            return sb.ToString();
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
        public int? Rating { get; set; }
        public DateTime? InterviewDate { get; set; }
        public string? MeetingLink { get; set; }
        public bool ConfirmTransition { get; set; } = false;
    }

    public class UpdateRatingDto
    {
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5.")]
        public int? Rating { get; set; }
    }

    public class UpdateNotesDto
    {
        public string? EmployerNotes { get; set; }
    }

    public class BulkStatusDto
    {
        public List<int> ApplicationIds { get; set; } = new();
        public string Status { get; set; } = string.Empty;
        public string? EmployerNotes { get; set; }
        public bool ConfirmTransition { get; set; } = false;
    }
}
