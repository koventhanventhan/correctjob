using HireConnect.API.Data;
using HireConnect.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;
using System.Security.Claims;

namespace HireConnect.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CandidatesController : ControllerBase
    {
        private readonly AppDbContext _context;

        // In-memory sliding-window rate limit tracker: max 30 search requests per minute per user
        private static readonly ConcurrentDictionary<string, List<DateTime>> _searchRateLimits = new();

        public CandidatesController(AppDbContext context)
        {
            _context = context;
        }

        // Helper: Check employer search rate limit (30 requests/minute)
        private static bool CheckSearchRateLimit(string userId)
        {
            var now = DateTime.UtcNow;
            var windowStart = now.AddMinutes(-1);

            var timestamps = _searchRateLimits.GetOrAdd(userId, _ => new List<DateTime>());
            lock (timestamps)
            {
                timestamps.RemoveAll(t => t < windowStart);
                if (timestamps.Count >= 30)
                {
                    return false;
                }
                timestamps.Add(now);
                return true;
            }
        }

        // Helper: Verify employer company status
        private async Task<(bool Allowed, Company? Company, string? ErrorMessage)> VerifyEmployerAccessAsync(string userId, bool isAdmin)
        {
            if (isAdmin)
            {
                return (true, null, null);
            }

            var company = await _context.Companies.FirstOrDefaultAsync(c => c.EmployerId == userId);
            if (company == null)
            {
                return (false, null, "Company profile not found. Please create your company profile first.");
            }

            if (company.VerificationStatus != "Verified" || !company.IsApproved)
            {
                return (false, company, "Access denied. Only employers with a verified and approved company can search candidates.");
            }

            return (true, company, null);
        }

        // Helper: Obfuscate name to First Name + Last Initial (e.g., "John D.")
        private static string ObfuscateName(string? fullName)
        {
            if (string.IsNullOrWhiteSpace(fullName)) return "Candidate";
            var parts = fullName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length <= 1) return parts[0];
            return $"{parts[0]} {char.ToUpper(parts[^1][0])}.";
        }

        // Helper: Calculate total years of experience
        private static int CalculateYearsOfExperience(SeekerProfile s)
        {
            if (s.WorkHistories != null && s.WorkHistories.Count > 0)
            {
                double totalMonths = 0;
                foreach (var w in s.WorkHistories)
                {
                    var start = w.StartDate ?? DateTime.UtcNow;
                    var end = w.IsCurrent ? DateTime.UtcNow : (w.EndDate ?? DateTime.UtcNow);
                    if (end > start)
                    {
                        totalMonths += (end.Year - start.Year) * 12 + (end.Month - start.Month);
                    }
                }
                if (totalMonths > 0)
                {
                    return (int)Math.Round(totalMonths / 12.0);
                }
            }

            if (s.Skills != null && s.Skills.Count > 0)
            {
                var maxSkillYears = s.Skills.Max(sk => sk.YearsExperience ?? 0);
                if (maxSkillYears > 0) return maxSkillYears;
            }

            if (!string.IsNullOrWhiteSpace(s.Experience))
            {
                var match = System.Text.RegularExpressions.Regex.Match(s.Experience, @"\d+");
                if (match.Success && int.TryParse(match.Value, out int exp))
                {
                    return exp;
                }
            }

            return 0;
        }

        /// <summary>
        /// GET /api/candidates
        /// Employer & Admin candidate search with strict privacy rules.
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "Employer,Admin")]
        public async Task<IActionResult> SearchCandidates(
            [FromQuery] string? keyword,
            [FromQuery] string? location,
            [FromQuery] string? skills,
            [FromQuery] int? minExperience,
            [FromQuery] int? maxExperience,
            [FromQuery] string? language,
            [FromQuery] string? sortBy = "recent",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            // Verification check for employers
            var access = await VerifyEmployerAccessAsync(userId, isAdmin);
            if (!access.Allowed)
            {
                return StatusCode(403, new { message = access.ErrorMessage });
            }

            // Rate limit check: 30 requests/minute per employer (admins exempt)
            if (!isAdmin && !CheckSearchRateLimit(userId))
            {
                return StatusCode(429, new { message = "Search rate limit exceeded. Maximum 30 search requests per minute." });
            }

            // Enforce pagination boundaries (max 20 per page)
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 20) pageSize = 20;

            // Strict Privacy Filter: ONLY seekers who are OpenToWork AND User is Active!
            var query = _context.SeekerProfiles
                .Include(s => s.User)
                .Include(s => s.Skills)
                .Include(s => s.WorkHistories)
                .Include(s => s.Educations)
                .Include(s => s.Languages)
                .Include(s => s.Certifications)
                .Where(s => s.IsOpenToWork && s.User.IsActive);

            // Filter: Keyword (matches CareerTitle, Bio, or Skills)
            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var kw = keyword.Trim().ToLower();
                query = query.Where(s =>
                    (s.CareerTitle != null && s.CareerTitle.ToLower().Contains(kw)) ||
                    (s.Bio != null && s.Bio.ToLower().Contains(kw)) ||
                    s.Skills.Any(sk => sk.SkillName.ToLower().Contains(kw)));
            }

            // Filter: Location
            if (!string.IsNullOrWhiteSpace(location))
            {
                var loc = location.Trim().ToLower();
                query = query.Where(s => s.Location != null && s.Location.ToLower().Contains(loc));
            }

            // Filter: Multi-skills
            if (!string.IsNullOrWhiteSpace(skills))
            {
                var skillList = skills.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                      .Select(s => s.Trim().ToLower())
                                      .Where(s => !string.IsNullOrEmpty(s))
                                      .ToList();

                if (skillList.Count > 0)
                {
                    query = query.Where(s => s.Skills.Any(sk => skillList.Contains(sk.SkillName.ToLower())));
                }
            }

            // Filter: Language
            if (!string.IsNullOrWhiteSpace(language))
            {
                var lang = language.Trim().ToLower();
                query = query.Where(s => s.Languages.Any(l => l.Language.ToLower().Contains(lang)));
            }

            // Execute base query
            var list = await query.ToListAsync();

            // In-memory filter for experience range (calculated dynamically)
            if (minExperience.HasValue)
            {
                list = list.Where(s => CalculateYearsOfExperience(s) >= minExperience.Value).ToList();
            }
            if (maxExperience.HasValue)
            {
                list = list.Where(s => CalculateYearsOfExperience(s) <= maxExperience.Value).ToList();
            }

            // Sorting
            list = sortBy?.ToLower() switch
            {
                "experience_desc" => list.OrderByDescending(CalculateYearsOfExperience).ToList(),
                "experience_asc" => list.OrderBy(CalculateYearsOfExperience).ToList(),
                "title" => list.OrderBy(s => s.CareerTitle ?? "").ToList(),
                _ => list.OrderByDescending(s => s.Id).ToList() // recent
            };

            var totalCount = list.Count;
            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);
            var paged = list.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            // Strict Privacy DTO projection - ZERO personal contact details
            var candidates = paged.Select(s => new
            {
                id = s.Id,
                fullName = ObfuscateName(s.User?.FullName),
                careerTitle = s.CareerTitle,
                location = s.Location,
                bio = s.Bio,
                yearsOfExperience = CalculateYearsOfExperience(s),
                skills = s.Skills.Select(sk => sk.SkillName).Distinct().ToList(),
                workHistories = s.WorkHistories.OrderByDescending(w => w.StartDate).Select(w => new
                {
                    id = w.Id,
                    jobTitle = w.JobTitle,
                    company = w.Company,
                    location = w.Location,
                    startDate = w.StartDate,
                    endDate = w.EndDate,
                    isCurrent = w.IsCurrent,
                    description = w.Description
                }).ToList(),
                educations = s.Educations.OrderByDescending(e => e.StartDate).Select(e => new
                {
                    id = e.Id,
                    degree = e.Degree,
                    institution = e.Institution,
                    fieldOfStudy = e.FieldOfStudy,
                    startDate = e.StartDate,
                    endDate = e.EndDate,
                    isCurrent = e.IsCurrent
                }).ToList(),
                languages = s.Languages.Select(l => new
                {
                    id = l.Id,
                    language = l.Language,
                    proficiency = l.Proficiency
                }).ToList(),
                certifications = s.Certifications.Select(c => new
                {
                    id = c.Id,
                    name = c.Name,
                    issuingOrganization = c.IssuingOrganization,
                    issueDate = c.IssueDate
                }).ToList()
            });

            return Ok(new
            {
                totalCount,
                page,
                pageSize,
                totalPages,
                candidates
            });
        }

        /// <summary>
        /// GET /api/candidates/{id}
        /// Detailed candidate profile view. Contact details are ONLY revealed if candidate accepted an invitation.
        /// </summary>
        [HttpGet("{id}")]
        [Authorize(Roles = "Employer,Admin")]
        public async Task<IActionResult> GetCandidateDetail(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var access = await VerifyEmployerAccessAsync(userId, isAdmin);
            if (!access.Allowed)
            {
                return StatusCode(403, new { message = access.ErrorMessage });
            }

            var s = await _context.SeekerProfiles
                .Include(sp => sp.User)
                .Include(sp => sp.Skills)
                .Include(sp => sp.WorkHistories)
                .Include(sp => sp.Educations)
                .Include(sp => sp.Languages)
                .Include(sp => sp.Certifications)
                .FirstOrDefaultAsync(sp => sp.Id == id && sp.IsOpenToWork && sp.User.IsActive);

            if (s == null)
            {
                return NotFound(new { message = "Candidate profile not found or is currently not open to work." });
            }

            // Check if candidate has accepted any invitation from this employer
            bool contactRevealed = false;
            object? contactInfo = null;

            if (isAdmin)
            {
                contactRevealed = true;
                contactInfo = new
                {
                    fullName = s.User?.FullName,
                    email = s.User?.Email,
                    phone = s.User?.PhoneNumber
                };
            }
            else
            {
                var acceptedInvitation = await _context.Invitations
                    .FirstOrDefaultAsync(i => i.EmployerId == userId && i.SeekerId == id && i.Status == "Accepted");

                if (acceptedInvitation != null)
                {
                    contactRevealed = true;
                    contactInfo = new
                    {
                        fullName = s.User?.FullName,
                        email = s.User?.Email,
                        phone = s.User?.PhoneNumber
                    };
                }
            }

            var candidateDto = new
            {
                id = s.Id,
                fullName = contactRevealed ? s.User?.FullName : ObfuscateName(s.User?.FullName),
                careerTitle = s.CareerTitle,
                location = s.Location,
                bio = s.Bio,
                yearsOfExperience = CalculateYearsOfExperience(s),
                contactRevealed,
                contactInfo,
                skills = s.Skills.Select(sk => sk.SkillName).Distinct().ToList(),
                workHistories = s.WorkHistories.OrderByDescending(w => w.StartDate).Select(w => new
                {
                    id = w.Id,
                    jobTitle = w.JobTitle,
                    company = w.Company,
                    location = w.Location,
                    startDate = w.StartDate,
                    endDate = w.EndDate,
                    isCurrent = w.IsCurrent,
                    description = w.Description
                }).ToList(),
                educations = s.Educations.OrderByDescending(e => e.StartDate).Select(e => new
                {
                    id = e.Id,
                    degree = e.Degree,
                    institution = e.Institution,
                    fieldOfStudy = e.FieldOfStudy,
                    startDate = e.StartDate,
                    endDate = e.EndDate,
                    isCurrent = e.IsCurrent
                }).ToList(),
                languages = s.Languages.Select(l => new
                {
                    id = l.Id,
                    language = l.Language,
                    proficiency = l.Proficiency
                }).ToList(),
                certifications = s.Certifications.Select(c => new
                {
                    id = c.Id,
                    name = c.Name,
                    issuingOrganization = c.IssuingOrganization,
                    issueDate = c.IssueDate
                }).ToList()
            };

            return Ok(candidateDto);
        }

        /// <summary>
        /// GET /api/candidates/my-published-jobs
        /// Returns employer's published jobs for the "Invite to Apply" dropdown.
        /// </summary>
        [HttpGet("my-published-jobs")]
        [Authorize(Roles = "Employer,Admin")]
        public async Task<IActionResult> GetMyPublishedJobs()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var access = await VerifyEmployerAccessAsync(userId, isAdmin);
            if (!access.Allowed)
            {
                return StatusCode(403, new { message = access.ErrorMessage });
            }

            var query = _context.Jobs
                .Where(j => j.Status == "Published");

            if (!isAdmin && access.Company != null)
            {
                query = query.Where(j => j.CompanyId == access.Company.Id);
            }

            var jobs = await query
                .OrderByDescending(j => j.CreatedAt)
                .Select(j => new
                {
                    id = j.Id,
                    title = j.Title,
                    location = j.Location,
                    jobType = j.JobType,
                    isRemote = j.IsRemote,
                    companyName = j.Company.CompanyName
                })
                .ToListAsync();

            return Ok(jobs);
        }

        /// <summary>
        /// POST /api/candidates/invite
        /// Employer invites candidate to apply for a published job.
        /// Rate limits: 20 invites/day per employer. Exactly 1 invite per seeker per job.
        /// </summary>
        [HttpPost("invite")]
        [Authorize(Roles = "Employer,Admin")]
        public async Task<IActionResult> InviteCandidate([FromBody] CandidateInviteDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var access = await VerifyEmployerAccessAsync(userId, isAdmin);
            if (!access.Allowed)
            {
                return StatusCode(403, new { message = access.ErrorMessage });
            }

            if (model.SeekerId <= 0 || model.JobId <= 0)
            {
                return BadRequest(new { message = "Invalid seeker or job ID." });
            }

            // Verify the job exists and is Published
            var job = await _context.Jobs.Include(j => j.Company).FirstOrDefaultAsync(j => j.Id == model.JobId);
            if (job == null)
            {
                return NotFound(new { message = "Job not found." });
            }

            if (job.Status != "Published")
            {
                return BadRequest(new { message = "Invitations can only be sent for Published jobs." });
            }

            // If employer (not admin), job must belong to employer's company
            if (!isAdmin && access.Company != null && job.CompanyId != access.Company.Id)
            {
                return StatusCode(403, new { message = "You can only invite candidates to jobs belonging to your company." });
            }

            // Verify seeker profile exists and is open to work
            var seeker = await _context.SeekerProfiles.Include(s => s.User).FirstOrDefaultAsync(s => s.Id == model.SeekerId);
            if (seeker == null || !seeker.IsOpenToWork || !seeker.User.IsActive)
            {
                return BadRequest(new { message = "Candidate profile is not available or not open to work." });
            }

            // Rate limit: Max 20 invites per day (in last 24 hours) for this employer
            var dayAgo = DateTime.UtcNow.AddHours(-24);
            var recentInviteCount = await _context.Invitations
                .CountAsync(i => i.EmployerId == userId && i.CreatedAt >= dayAgo);

            if (!isAdmin && recentInviteCount >= 20)
            {
                return StatusCode(429, new { message = "Daily invitation limit reached (maximum 20 invites per day)." });
            }

            // Duplicate check: Same seeker for same job cannot receive duplicate invite
            var duplicateExists = await _context.Invitations
                .AnyAsync(i => i.JobId == model.JobId && i.SeekerId == model.SeekerId);

            if (duplicateExists)
            {
                return BadRequest(new { message = "You have already invited this candidate for this job." });
            }

            // Create JobInvitation
            var invitation = new JobInvitation
            {
                EmployerId = userId,
                CompanyId = job.CompanyId,
                JobId = model.JobId,
                SeekerId = model.SeekerId,
                Message = model.Message?.Trim(),
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.Invitations.Add(invitation);

            // Send notification to seeker
            var companyName = job.Company?.CompanyName ?? "An employer";
            var notification = new Notification
            {
                UserId = seeker.UserId,
                Title = "Job Invitation Received",
                Message = $"You have been invited to apply for '{job.Title}' by {companyName}.",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Invitation sent successfully.",
                invitationId = invitation.Id
            });
        }

        /// <summary>
        /// GET /api/candidates/invitations/my-invitations
        /// Seeker views received invitations.
        /// </summary>
        [HttpGet("invitations/my-invitations")]
        [Authorize(Roles = "JobSeeker")]
        public async Task<IActionResult> GetMyInvitations()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var seeker = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (seeker == null)
            {
                return Ok(new List<object>());
            }

            var invitations = await _context.Invitations
                .Include(i => i.Job)
                .Include(i => i.Company)
                .Where(i => i.SeekerId == seeker.Id)
                .OrderByDescending(i => i.CreatedAt)
                .Select(i => new
                {
                    id = i.Id,
                    jobId = i.JobId,
                    jobTitle = i.Job.Title,
                    jobLocation = i.Job.Location,
                    jobType = i.Job.JobType,
                    companyName = i.Company.CompanyName,
                    companyLogo = i.Company.LogoUrl,
                    message = i.Message,
                    status = i.Status,
                    createdAt = i.CreatedAt,
                    respondedAt = i.RespondedAt
                })
                .ToListAsync();

            return Ok(invitations);
        }

        /// <summary>
        /// PATCH /api/candidates/invitations/{id}/respond
        /// Seeker accepts or declines an invitation.
        /// </summary>
        [HttpPatch("invitations/{id}/respond")]
        [Authorize(Roles = "JobSeeker")]
        public async Task<IActionResult> RespondToInvitation(int id, [FromBody] RespondInvitationDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var status = model.Status?.Trim();
            if (status != "Accepted" && status != "Declined")
            {
                return BadRequest(new { message = "Invalid status. Must be 'Accepted' or 'Declined'." });
            }

            var seeker = await _context.SeekerProfiles
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (seeker == null)
            {
                return NotFound(new { message = "Seeker profile not found." });
            }

            var invitation = await _context.Invitations
                .Include(i => i.Job)
                .Include(i => i.Company)
                .FirstOrDefaultAsync(i => i.Id == id && i.SeekerId == seeker.Id);

            if (invitation == null)
            {
                return NotFound(new { message = "Invitation not found." });
            }

            if (invitation.Status != "Pending")
            {
                return BadRequest(new { message = $"This invitation has already been {invitation.Status.ToLower()}." });
            }

            invitation.Status = status;
            invitation.RespondedAt = DateTime.UtcNow;

            // If accepted, notify the employer that contact details can now be shared
            if (status == "Accepted")
            {
                var employerNotification = new Notification
                {
                    UserId = invitation.EmployerId,
                    Title = "Candidate Accepted Invitation!",
                    Message = $"Candidate accepted your invitation for '{invitation.Job.Title}'. Contact details are now available.",
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                };
                _context.Notifications.Add(employerNotification);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Invitation {status.ToLower()} successfully.",
                status = invitation.Status,
                jobId = invitation.JobId
            });
        }
    }

    public class CandidateInviteDto
    {
        public int SeekerId { get; set; }
        public int JobId { get; set; }
        public string? Message { get; set; }
    }

    public class RespondInvitationDto
    {
        public string Status { get; set; } = string.Empty;
    }
}
