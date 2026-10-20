using HireConnect.API.Data;
using HireConnect.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using HireConnect.API.Services;

namespace HireConnect.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")] // Global admin auth
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IAuditLogService _auditLogService;

        public AdminController(AppDbContext context, IAuditLogService auditLogService)
        {
            _context = context;
            _auditLogService = auditLogService;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var query = _context.Users.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(u => u.FullName.Contains(search) || (u.Email != null && u.Email.Contains(search)));
            }

            var totalCount = await query.CountAsync();

            var users = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new 
                { 
                    u.Id, 
                    u.FullName, 
                    u.Email, 
                    u.IsActive,
                    Role = _context.UserRoles
                        .Where(ur => ur.UserId == u.Id)
                        .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
                        .FirstOrDefault() ?? "JobSeeker"
                })
                .ToListAsync();

            return Ok(new { data = users, totalCount });
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
        public async Task<IActionResult> BlockUser(string id, [FromBody] bool isActive = false)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            var currentAdminId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // Self-block check: Admin cannot block their own account
            if (currentAdminId == id && !isActive)
            {
                return BadRequest(new { message = "You cannot block your own admin account." });
            }

            var isAdmin = await _context.UserRoles
                .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, r.Name })
                .AnyAsync(x => x.UserId == id && x.Name == "Admin");

            // Last active Admin check: Prevent blocking the last active admin
            if (isAdmin && !isActive)
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

            user.IsActive = isActive;
            await _context.SaveChangesAsync();

            // Record immutable audit log
            if (!string.IsNullOrEmpty(currentAdminId))
            {
                var action = isActive ? "USER_UNBLOCKED" : "USER_BLOCKED";
                var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
                await _auditLogService.LogAsync(
                    currentAdminId,
                    action,
                    "User",
                    user.Id,
                    $"Admin changed status of {user.Email} to {(isActive ? "Active" : "Blocked")}",
                    ip
                );
            }

            return Ok(new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.IsActive,
                message = $"User {(isActive ? "unblocked" : "blocked")} successfully."
            });
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
    }

    public class VerificationDecisionDto
    {
        public bool Approved { get; set; }
        public string? Notes { get; set; }
    }
}
