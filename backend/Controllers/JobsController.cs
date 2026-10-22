using HireConnect.API.Data;
using HireConnect.API.Models;
using HireConnect.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HireConnect.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class JobsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public JobsController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpGet]
        public async Task<IActionResult> GetJobs(
            [FromQuery] int page = 1, 
            [FromQuery] int pageSize = 12, 
            [FromQuery] string? keyword = null, 
            [FromQuery] string? location = null, 
            [FromQuery] int? category = null, 
            [FromQuery] decimal? minSalary = null, 
            [FromQuery] decimal? maxSalary = null, 
            [FromQuery] int? experience = null, 
            [FromQuery] string? jobType = null, 
            [FromQuery] bool? remote = null,
            [FromQuery] string? datePosted = null,
            [FromQuery] string? sortBy = "newest",
            [FromQuery] int? companyId = null)
        {
            var query = _context.Jobs
                .Include(j => j.Company)
                .Include(j => j.Category)
                .Include(j => j.JobSkills)
                .ThenInclude(js => js.Skill)
                .AsQueryable();

            var isAdmin = User.IsInRole("Admin");
            var isEmployer = User.IsInRole("Employer");
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            if (!isAdmin)
            {
                var now = DateTime.UtcNow;
                if (isEmployer)
                {
                    query = query.Where(j => (j.Status == "Published" && j.Company.IsApproved && (!j.Deadline.HasValue || j.Deadline.Value >= now)) || j.Company.EmployerId == userId);
                }
                else
                {
                    query = query.Where(j => j.Status == "Published" && j.Company.IsApproved && (!j.Deadline.HasValue || j.Deadline.Value >= now));
                }
            }

            // Filters
            if (!string.IsNullOrEmpty(keyword))
            {
                var kw = keyword.Trim();
                query = query.Where(j => j.Title.Contains(kw) || j.Description.Contains(kw));
            }
            if (!string.IsNullOrEmpty(location))
            {
                var loc = location.Trim();
                query = query.Where(j => j.Location != null && j.Location.Contains(loc));
            }
            if (category.HasValue)
            {
                query = query.Where(j => j.CategoryId == category.Value);
            }
            if (minSalary.HasValue)
            {
                query = query.Where(j => (j.SalaryMax ?? j.SalaryMin ?? 0) >= minSalary.Value);
            }
            if (maxSalary.HasValue)
            {
                query = query.Where(j => (j.SalaryMin ?? j.SalaryMax ?? 0) <= maxSalary.Value);
            }
            if (experience.HasValue)
            {
                query = query.Where(j => j.ExperienceMin <= experience.Value && j.ExperienceMax >= experience.Value);
            }
            if (!string.IsNullOrEmpty(jobType))
            {
                query = query.Where(j => j.JobType == jobType);
            }
            if (companyId.HasValue)
            {
                query = query.Where(j => j.CompanyId == companyId.Value);
            }
            if (remote.HasValue && remote.Value)
            {
                query = query.Where(j => j.IsRemote || 
                                         (j.Location != null && j.Location.Contains("Remote")) || 
                                         (j.JobType != null && j.JobType.Contains("Remote")) || 
                                         (j.Description != null && j.Description.Contains("Remote")));
            }
            if (!string.IsNullOrEmpty(datePosted))
            {
                var now = DateTime.UtcNow;
                if (datePosted.Equals("24h", StringComparison.OrdinalIgnoreCase))
                {
                    var threshold = now.AddHours(-24);
                    query = query.Where(j => j.CreatedAt >= threshold);
                }
                else if (datePosted.Equals("7d", StringComparison.OrdinalIgnoreCase))
                {
                    var threshold = now.AddDays(-7);
                    query = query.Where(j => j.CreatedAt >= threshold);
                }
                else if (datePosted.Equals("30d", StringComparison.OrdinalIgnoreCase))
                {
                    var threshold = now.AddDays(-30);
                    query = query.Where(j => j.CreatedAt >= threshold);
                }
            }

            // Sorting
            if (!string.IsNullOrEmpty(sortBy))
            {
                if (sortBy.Equals("salaryHigh", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.OrderByDescending(j => j.SalaryMax ?? j.SalaryMin ?? 0);
                }
                else if (sortBy.Equals("salaryLow", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.OrderBy(j => j.SalaryMin ?? j.SalaryMax ?? 0);
                }
                else if (sortBy.Equals("relevance", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(keyword))
                {
                    query = query.OrderByDescending(j => j.Title.Contains(keyword)).ThenByDescending(j => j.CreatedAt);
                }
                else
                {
                    query = query.OrderByDescending(j => j.CreatedAt);
                }
            }
            else
            {
                query = query.OrderByDescending(j => j.CreatedAt);
            }

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            var jobs = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(j => new JobResponseDto
                {
                    Id = j.Id,
                    CompanyId = j.CompanyId,
                    Title = j.Title,
                    Description = j.Description,
                    Requirements = j.Requirements,
                    Responsibilities = j.Responsibilities,
                    Location = j.Location,
                    IsRemote = j.IsRemote,
                    SalaryMin = j.SalaryMin,
                    SalaryMax = j.SalaryMax,
                    ExperienceMin = j.ExperienceMin,
                    ExperienceMax = j.ExperienceMax,
                    JobType = j.JobType,
                    CategoryId = j.CategoryId,
                    Deadline = j.Deadline,
                    Status = j.Status,
                    CreatedAt = j.CreatedAt,
                    IsPaid = j.IsPaid,
                    ClosedByAdmin = j.ClosedByAdmin,
                    PublishedAt = j.PublishedAt,
                    IsExpired = j.Status == "Expired" || (j.Deadline.HasValue && j.Deadline.Value < DateTime.UtcNow),
                    Company = j.Company == null ? null : new JobCompanyDto
                    {
                        Id = j.Company.Id,
                        CompanyName = j.Company.CompanyName,
                        LogoUrl = j.Company.LogoUrl,
                        Location = j.Company.Location,
                        Industry = j.Company.Industry,
                        Website = j.Company.Website,
                        Description = j.Company.Description,
                        CompanySize = j.Company.CompanySize,
                        IsApproved = j.Company.IsApproved
                    },
                    Category = j.Category == null ? null : new JobCategoryDto
                    {
                        Id = j.Category.Id,
                        Name = j.Category.Name
                    },
                    Skills = j.JobSkills.Select(js => js.Skill.Name).ToList()
                })
                .ToListAsync();

            return Ok(new
            {
                data = jobs,
                pagination = new
                {
                    totalCount,
                    totalPages,
                    currentPage = page,
                    pageSize
                }
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetJob(int id)
        {
            var job = await _context.Jobs
                .Include(j => j.Company)
                .Include(j => j.Category)
                .Include(j => j.JobSkills)
                .ThenInclude(js => js.Skill)
                .Include(j => j.ScreeningQuestions)
                .FirstOrDefaultAsync(j => j.Id == id);

            if (job == null) return NotFound();

            var isAdmin = User.IsInRole("Admin");
            var isEmployer = User.IsInRole("Employer");
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            bool isOwnJob = isEmployer && job.Company.EmployerId == userId;

            if (!isAdmin)
            {
                bool isPubliclyVisible = (job.Status == "Published" || job.Status == "Expired" || job.Status == "Closed") && 
                                         job.Company != null && job.Company.IsApproved;
                if (!isOwnJob && !isPubliclyVisible)
                {
                    return Forbid();
                }
            }

            var viewsCount = await _context.JobViews.CountAsync(v => v.JobId == job.Id);
            var applicantsCount = await _context.Applications.CountAsync(a => a.JobId == job.Id);
            bool isExpired = job.Status == "Expired" || (job.Deadline.HasValue && job.Deadline.Value < DateTime.UtcNow);

            var dto = new JobResponseDto
            {
                Id = job.Id,
                CompanyId = job.CompanyId,
                Title = job.Title,
                Description = job.Description,
                Requirements = job.Requirements,
                Responsibilities = job.Responsibilities,
                Location = job.Location,
                IsRemote = job.IsRemote,
                SalaryMin = job.SalaryMin,
                SalaryMax = job.SalaryMax,
                ExperienceMin = job.ExperienceMin,
                ExperienceMax = job.ExperienceMax,
                JobType = job.JobType,
                CategoryId = job.CategoryId,
                Deadline = job.Deadline,
                Status = job.Status,
                CreatedAt = job.CreatedAt,
                IsPaid = job.IsPaid,
                ClosedByAdmin = job.ClosedByAdmin,
                PublishedAt = job.PublishedAt,
                IsExpired = isExpired,
                ViewsCount = viewsCount,
                ApplicantsCount = applicantsCount,
                Company = job.Company == null ? null : new JobCompanyDto
                {
                    Id = job.Company.Id,
                    CompanyName = job.Company.CompanyName,
                    LogoUrl = job.Company.LogoUrl,
                    Location = job.Company.Location,
                    Industry = job.Company.Industry,
                    Website = job.Company.Website,
                    Description = job.Company.Description,
                    CompanySize = job.Company.CompanySize,
                    IsApproved = job.Company.IsApproved
                },
                Category = job.Category == null ? null : new JobCategoryDto
                {
                    Id = job.Category.Id,
                    Name = job.Category.Name
                },
                Skills = job.JobSkills.Select(js => js.Skill.Name).ToList(),
                ScreeningQuestions = job.ScreeningQuestions
                    .OrderBy(q => q.OrderIndex)
                    .Select(q => new ScreeningQuestionResponseDto
                    {
                        Id = q.Id,
                        QuestionText = q.QuestionText,
                        QuestionType = q.QuestionType,
                        IsRequired = q.IsRequired,
                        IdealAnswer = q.IdealAnswer,
                        OrderIndex = q.OrderIndex
                    }).ToList()
            };

            return Ok(dto);
        }

        private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, (int count, DateTime windowStart)> _viewRateLimits = new();

        [HttpPost("{id}/view")]
        public async Task<IActionResult> TrackJobView(int id)
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var now = DateTime.UtcNow;

            // IP Rate Limit: 60 requests per minute
            var rate = _viewRateLimits.AddOrUpdate(
                ip,
                _ => (1, now),
                (_, val) => (now - val.windowStart).TotalMinutes >= 1 ? (1, now) : (val.count + 1, val.windowStart)
            );

            if (rate.count > 60)
            {
                return StatusCode(StatusCodes.Status429TooManyRequests, new { message = "Rate limit exceeded. Maximum 60 views per minute." });
            }

            // Cleanup stale rate limit entries periodically
            if (_viewRateLimits.Count > 1000)
            {
                foreach (var key in _viewRateLimits.Keys)
                {
                    if (_viewRateLimits.TryGetValue(key, out var entry) && (now - entry.windowStart).TotalMinutes >= 2)
                    {
                        _viewRateLimits.TryRemove(key, out _);
                    }
                }
            }

            var job = await _context.Jobs
                .Include(j => j.Company)
                .FirstOrDefaultAsync(j => j.Id == id);

            if (job == null) return NotFound();

            // Count view ONLY if Job Status is Published, Company is Approved, and job is NOT expired
            bool isCountable = job.Status == "Published" &&
                               job.Company != null &&
                               job.Company.IsApproved &&
                               (!job.Deadline.HasValue || job.Deadline.Value >= now);

            if (!isCountable)
            {
                return NoContent(); // 204 No Content (no count)
            }

            var isEmployer = User.IsInRole("Employer");
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            bool isOwnJob = isEmployer && job.Company != null && job.Company.EmployerId == userId;

            // Views count: oru user/IP ku oru job ku oru naalaiku oru thadava mattum count, employer thaan paartha count pannaatha
            if (!isOwnJob)
            {
                var today = DateTime.UtcNow.Date;

                bool alreadyViewed;
                if (!string.IsNullOrEmpty(userId))
                {
                    alreadyViewed = await _context.JobViews.AnyAsync(v => 
                        v.JobId == id && 
                        v.ViewedDate == today && 
                        v.UserId == userId);

                    if (!alreadyViewed)
                    {
                        try
                        {
                            _context.JobViews.Add(new JobView
                            {
                                JobId = id,
                                UserId = userId,
                                IpHash = null,
                                ViewedDate = today,
                                CreatedAt = DateTime.UtcNow
                            });
                            await _context.SaveChangesAsync();
                        }
                        catch (DbUpdateException ex)
                        {
                            // Concurrency duplicate insert caught by unique index
                            foreach (var entry in ex.Entries)
                            {
                                entry.State = EntityState.Detached;
                            }
                        }
                    }
                }
                else
                {
                    var ipHash = ComputeIpHash(ip);

                    alreadyViewed = await _context.JobViews.AnyAsync(v => 
                        v.JobId == id && 
                        v.ViewedDate == today && 
                        v.IpHash == ipHash);

                    if (!alreadyViewed)
                    {
                        try
                        {
                            _context.JobViews.Add(new JobView
                            {
                                JobId = id,
                                UserId = null,
                                IpHash = ipHash,
                                ViewedDate = today,
                                CreatedAt = DateTime.UtcNow
                            });
                            await _context.SaveChangesAsync();
                        }
                        catch (DbUpdateException ex)
                        {
                            // Concurrency duplicate insert caught by unique index
                            foreach (var entry in ex.Entries)
                            {
                                entry.State = EntityState.Detached;
                            }
                        }
                    }
                }
            }

            return Ok(new { success = true });
        }

        [HttpGet("{id}/similar")]
        public async Task<IActionResult> GetSimilarJobs(int id)
        {
            var job = await _context.Jobs
                .Include(j => j.JobSkills)
                .FirstOrDefaultAsync(j => j.Id == id);

            if (job == null) return NotFound();

            var query = _context.Jobs
                .Include(j => j.Company)
                .Include(j => j.Category)
                .Include(j => j.JobSkills)
                .ThenInclude(js => js.Skill)
                .Where(j => j.Id != id && j.Status == "Published");

            var similarJobs = await query
                .Where(j => j.CategoryId == job.CategoryId || (job.Location != null && j.Location == job.Location))
                .OrderByDescending(j => j.CategoryId == job.CategoryId)
                .ThenByDescending(j => j.CreatedAt)
                .Take(4)
                .Select(j => new JobResponseDto
                {
                    Id = j.Id,
                    CompanyId = j.CompanyId,
                    Title = j.Title,
                    Description = j.Description,
                    Requirements = j.Requirements,
                    Responsibilities = j.Responsibilities,
                    Location = j.Location,
                    IsRemote = j.IsRemote,
                    SalaryMin = j.SalaryMin,
                    SalaryMax = j.SalaryMax,
                    ExperienceMin = j.ExperienceMin,
                    ExperienceMax = j.ExperienceMax,
                    JobType = j.JobType,
                    CategoryId = j.CategoryId,
                    Deadline = j.Deadline,
                    Status = j.Status,
                    CreatedAt = j.CreatedAt,
                    IsPaid = j.IsPaid,
                    Company = j.Company == null ? null : new JobCompanyDto
                    {
                        Id = j.Company.Id,
                        CompanyName = j.Company.CompanyName,
                        LogoUrl = j.Company.LogoUrl,
                        Location = j.Company.Location,
                        Industry = j.Company.Industry,
                        Website = j.Company.Website,
                        Description = j.Company.Description,
                        CompanySize = j.Company.CompanySize,
                        IsApproved = j.Company.IsApproved
                    },
                    Category = j.Category == null ? null : new JobCategoryDto
                    {
                        Id = j.Category.Id,
                        Name = j.Category.Name
                    },
                    Skills = j.JobSkills.Select(js => js.Skill.Name).ToList()
                })
                .ToListAsync();

            return Ok(similarJobs);
        }

        [HttpGet("recommended")]
        [Authorize(Roles = "JobSeeker")]
        public async Task<IActionResult> GetRecommendedJobs([FromQuery] int limit = 6)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var seeker = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (seeker == null) return NotFound("Seeker profile not found.");

            // Exclude jobs already applied to
            var appliedJobIds = await _context.Applications
                .Where(a => a.SeekerId == seeker.Id)
                .Select(a => a.JobId)
                .ToListAsync();

            // Categories seeker has engaged with
            var appliedCategoryIds = await _context.Applications
                .Where(a => a.SeekerId == seeker.Id)
                .Select(a => a.Job.CategoryId)
                .ToListAsync();

            var savedCategoryIds = await _context.SavedJobs
                .Where(s => s.SeekerId == seeker.Id)
                .Select(s => s.Job.CategoryId)
                .ToListAsync();

            var preferredCategoryIds = appliedCategoryIds.Concat(savedCategoryIds).Distinct().ToHashSet();

            var titleKeyword = !string.IsNullOrWhiteSpace(seeker.CareerTitle) ? seeker.CareerTitle.Trim().ToLower() : "";
            var locationKeyword = !string.IsNullOrWhiteSpace(seeker.Location) ? seeker.Location.Trim().ToLower() : "";

            var candidates = await _context.Jobs
                .Include(j => j.Company)
                .Include(j => j.Category)
                .Include(j => j.JobSkills)
                .ThenInclude(js => js.Skill)
                .Where(j => j.Status == "Published" && !appliedJobIds.Contains(j.Id))
                .OrderByDescending(j => j.CreatedAt)
                .Take(50)
                .ToListAsync();

            var scored = candidates.Select(j =>
            {
                int score = 0;
                var jTitle = (j.Title ?? "").ToLower();
                var jDesc = (j.Description ?? "").ToLower();
                var jLoc = (j.Location ?? "").ToLower();

                if (!string.IsNullOrEmpty(titleKeyword))
                {
                    if (jTitle.Contains(titleKeyword)) score += 10;
                    else
                    {
                        var words = titleKeyword.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                        foreach (var w in words)
                        {
                            if (jTitle.Contains(w)) score += 3;
                            else if (jDesc.Contains(w)) score += 1;
                        }
                    }
                }

                if (!string.IsNullOrEmpty(locationKeyword) && (jLoc.Contains(locationKeyword) || jLoc.Contains("remote")))
                {
                    score += 5;
                }

                if (preferredCategoryIds.Contains(j.CategoryId))
                {
                    score += 4;
                }

                return new { Job = j, Score = score };
            })
            .OrderByDescending(x => x.Score)
            .ThenByDescending(x => x.Job.CreatedAt)
            .Take(limit)
            .Select(x => new JobResponseDto
            {
                Id = x.Job.Id,
                CompanyId = x.Job.CompanyId,
                Title = x.Job.Title,
                Description = x.Job.Description,
                Requirements = x.Job.Requirements,
                Responsibilities = x.Job.Responsibilities,
                Location = x.Job.Location,
                IsRemote = x.Job.IsRemote,
                SalaryMin = x.Job.SalaryMin,
                SalaryMax = x.Job.SalaryMax,
                ExperienceMin = x.Job.ExperienceMin,
                ExperienceMax = x.Job.ExperienceMax,
                JobType = x.Job.JobType,
                CategoryId = x.Job.CategoryId,
                Deadline = x.Job.Deadline,
                Status = x.Job.Status,
                CreatedAt = x.Job.CreatedAt,
                IsPaid = x.Job.IsPaid,
                Company = x.Job.Company == null ? null : new JobCompanyDto
                {
                    Id = x.Job.Company.Id,
                    CompanyName = x.Job.Company.CompanyName,
                    LogoUrl = x.Job.Company.LogoUrl,
                    Location = x.Job.Company.Location,
                    Industry = x.Job.Company.Industry,
                    Website = x.Job.Company.Website,
                    Description = x.Job.Company.Description,
                    CompanySize = x.Job.Company.CompanySize,
                    IsApproved = x.Job.Company.IsApproved
                },
                Category = x.Job.Category == null ? null : new JobCategoryDto
                {
                    Id = x.Job.Category.Id,
                    Name = x.Job.Category.Name
                },
                Skills = x.Job.JobSkills.Select(js => js.Skill.Name).ToList()
            })
            .ToList();

            return Ok(scored);
        }

        /// <summary>
        /// GET /api/jobs/employer-analytics
        /// Returns job-wise views, applies, conversion rate, total views/applies, and 30-day daily trend.
        /// Strictly isolated to the authenticated employer's own company jobs.
        /// </summary>
        [HttpGet("employer-analytics")]
        [Authorize(Roles = "Employer,Admin")]
        public async Task<IActionResult> GetEmployerAnalytics()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            // Verify company ownership
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.EmployerId == userId);
            if (company == null)
            {
                var emptyResult = new EmployerAnalyticsDto
                {
                    TotalJobs = 0,
                    TotalViews = 0,
                    TotalApplications = 0,
                    OverallConversionRate = 0,
                    DailyTrends = GenerateEmptyDailyTrends(DateTime.UtcNow.Date.AddDays(-29), DateTime.UtcNow.Date),
                    JobStats = new List<JobAnalyticsItemDto>()
                };
                return Ok(emptyResult);
            }

            // Fetch all jobs for this employer's company
            var jobs = await _context.Jobs
                .Where(j => j.CompanyId == company.Id)
                .OrderByDescending(j => j.CreatedAt)
                .Select(j => new
                {
                    j.Id,
                    j.Title,
                    j.Status,
                    j.Deadline,
                    j.CreatedAt
                })
                .ToListAsync();

            var jobIds = jobs.Select(j => j.Id).ToList();

            // Total & per-job views count
            var viewsByJob = await _context.JobViews
                .Where(v => jobIds.Contains(v.JobId))
                .GroupBy(v => v.JobId)
                .Select(g => new { JobId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.JobId, x => x.Count);

            // Total & per-job applications count
            var appsByJob = await _context.Applications
                .Where(a => jobIds.Contains(a.JobId))
                .GroupBy(a => a.JobId)
                .Select(g => new { JobId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.JobId, x => x.Count);

            // 30 days range
            var today = DateTime.UtcNow.Date;
            var startDate = today.AddDays(-29);

            // Daily views in last 30 days
            var dailyViews = await _context.JobViews
                .Where(v => jobIds.Contains(v.JobId) && v.ViewedDate >= startDate && v.ViewedDate <= today)
                .GroupBy(v => v.ViewedDate)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Date, x => x.Count);

            // Daily applications in last 30 days
            var dailyApps = await _context.Applications
                .Where(a => jobIds.Contains(a.JobId) && a.AppliedAt.Date >= startDate && a.AppliedAt.Date <= today)
                .GroupBy(a => a.AppliedAt.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Date, x => x.Count);

            var dailyTrends = new List<DailyTrendDto>();
            for (var d = startDate; d <= today; d = d.AddDays(1))
            {
                dailyTrends.Add(new DailyTrendDto
                {
                    Date = d.ToString("yyyy-MM-dd"),
                    Views = dailyViews.GetValueOrDefault(d, 0),
                    Applications = dailyApps.GetValueOrDefault(d, 0)
                });
            }

            var totalViews = viewsByJob.Values.Sum();
            var totalApps = appsByJob.Values.Sum();
            var overallConversion = totalViews > 0 ? Math.Round((double)totalApps / totalViews * 100, 1) : 0;

            var jobStats = jobs.Select(j =>
            {
                var vCount = viewsByJob.GetValueOrDefault(j.Id, 0);
                var aCount = appsByJob.GetValueOrDefault(j.Id, 0);
                var conv = vCount > 0 ? Math.Round((double)aCount / vCount * 100, 1) : 0;
                return new JobAnalyticsItemDto
                {
                    JobId = j.Id,
                    Title = j.Title,
                    Status = j.Status,
                    ViewsCount = vCount,
                    ApplicationsCount = aCount,
                    ConversionRate = conv,
                    Deadline = j.Deadline,
                    CreatedAt = j.CreatedAt
                };
            }).ToList();

            var dto = new EmployerAnalyticsDto
            {
                TotalJobs = jobs.Count,
                TotalViews = totalViews,
                TotalApplications = totalApps,
                OverallConversionRate = overallConversion,
                DailyTrends = dailyTrends,
                JobStats = jobStats
            };

            return Ok(dto);
        }

        private static List<DailyTrendDto> GenerateEmptyDailyTrends(DateTime start, DateTime end)
        {
            var list = new List<DailyTrendDto>();
            for (var d = start; d <= end; d = d.AddDays(1))
            {
                list.Add(new DailyTrendDto
                {
                    Date = d.ToString("yyyy-MM-dd"),
                    Views = 0,
                    Applications = 0
                });
            }
            return list;
        }

        [HttpGet("my-jobs")]
        [Authorize(Roles = "Employer")]
        public async Task<IActionResult> GetMyJobs(
            [FromQuery] int page = 1, 
            [FromQuery] int pageSize = 12,
            [FromQuery] string? status = null,
            [FromQuery] string? search = null)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var query = _context.Jobs
                .Include(j => j.Company)
                .Include(j => j.Category)
                .Include(j => j.JobSkills)
                .ThenInclude(js => js.Skill)
                .Include(j => j.Applications)
                .Include(j => j.Views)
                .Where(j => j.Company.EmployerId == userId)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim();
                query = query.Where(j => j.Title.Contains(s));
            }

            var now = DateTime.UtcNow;
            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                if (status.Equals("Expired", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(j => j.Status == "Expired" || (j.Status == "Published" && j.Deadline.HasValue && j.Deadline.Value < now));
                }
                else if (status.Equals("Published", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(j => j.Status == "Published" && (!j.Deadline.HasValue || j.Deadline.Value >= now));
                }
                else
                {
                    query = query.Where(j => j.Status == status);
                }
            }

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            // Tab status counts
            var allMyJobs = await _context.Jobs
                .Where(j => j.Company.EmployerId == userId)
                .Select(j => new { j.Status, j.Deadline })
                .ToListAsync();

            var counts = new
            {
                all = allMyJobs.Count,
                published = allMyJobs.Count(j => j.Status == "Published" && (!j.Deadline.HasValue || j.Deadline.Value >= now)),
                draft = allMyJobs.Count(j => j.Status == "Draft"),
                pendingApproval = allMyJobs.Count(j => j.Status == "PendingApproval"),
                closed = allMyJobs.Count(j => j.Status == "Closed"),
                expired = allMyJobs.Count(j => j.Status == "Expired" || (j.Status == "Published" && j.Deadline.HasValue && j.Deadline.Value < now))
            };

            var jobs = await query
                .OrderByDescending(j => j.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(j => new JobResponseDto
                {
                    Id = j.Id,
                    CompanyId = j.CompanyId,
                    Title = j.Title,
                    Description = j.Description,
                    Requirements = j.Requirements,
                    Responsibilities = j.Responsibilities,
                    Location = j.Location,
                    IsRemote = j.IsRemote,
                    SalaryMin = j.SalaryMin,
                    SalaryMax = j.SalaryMax,
                    ExperienceMin = j.ExperienceMin,
                    ExperienceMax = j.ExperienceMax,
                    JobType = j.JobType,
                    CategoryId = j.CategoryId,
                    Deadline = j.Deadline,
                    Status = j.Status,
                    CreatedAt = j.CreatedAt,
                    IsPaid = j.IsPaid,
                    ClosedByAdmin = j.ClosedByAdmin,
                    PublishedAt = j.PublishedAt,
                    IsExpired = j.Status == "Expired" || (j.Deadline.HasValue && j.Deadline.Value < now),
                    ViewsCount = j.Views.Count,
                    ApplicantsCount = j.Applications.Count,
                    Company = j.Company == null ? null : new JobCompanyDto
                    {
                        Id = j.Company.Id,
                        CompanyName = j.Company.CompanyName,
                        LogoUrl = j.Company.LogoUrl,
                        Location = j.Company.Location,
                        Industry = j.Company.Industry,
                        Website = j.Company.Website,
                        Description = j.Company.Description,
                        CompanySize = j.Company.CompanySize,
                        IsApproved = j.Company.IsApproved
                    },
                    Category = j.Category == null ? null : new JobCategoryDto
                    {
                        Id = j.Category.Id,
                        Name = j.Category.Name
                    },
                    Skills = j.JobSkills.Select(js => js.Skill.Name).ToList()
                })
                .ToListAsync();

            return Ok(new
            {
                data = jobs,
                statusCounts = counts,
                pagination = new
                {
                    totalCount,
                    totalPages,
                    currentPage = page,
                    pageSize
                }
            });
        }

        [HttpPost]
        [Authorize(Roles = "Employer")]
        public async Task<IActionResult> CreateJob([FromBody] JobDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.EmployerId == userId);
            
            if (company == null) return BadRequest(new { message = "You must create a company profile first." });
            if (company.VerificationStatus != "Verified") return BadRequest(new { message = "Your identity must be verified before posting jobs." });
            if (!company.IsApproved) return Forbid(); // "An Employer's company must be Admin-approved before it can post jobs at all."

            // Whitelist QuestionType (Text, YesNo, Number), max 10 questions, lengths <= 300
            var (isQuestionsValid, questionsError) = ValidateScreeningQuestions(model.ScreeningQuestions);
            if (!isQuestionsValid) return BadRequest(new { message = questionsError });

            var category = await _context.Categories.FindAsync(model.CategoryId);
            if (category == null || !category.IsActive)
            {
                return BadRequest(new { message = "Selected category is not active or does not exist." });
            }

            var job = new Job
            {
                CompanyId = company.Id,
                Title = model.Title.Trim(),
                Description = model.Description.Trim(),
                Requirements = model.Requirements?.Trim(),
                Responsibilities = model.Responsibilities?.Trim(),
                Location = model.Location?.Trim(),
                IsRemote = model.IsRemote,
                SalaryMin = model.SalaryMin,
                SalaryMax = model.SalaryMax,
                ExperienceMin = model.ExperienceMin,
                ExperienceMax = model.ExperienceMax,
                JobType = model.JobType?.Trim(),
                CategoryId = model.CategoryId,
                Deadline = model.Deadline,
                Status = "Draft" // Strict state machine starts at Draft
            };

            _context.Jobs.Add(job);
            await _context.SaveChangesAsync();

            // Save screening questions if provided
            if (model.ScreeningQuestions != null && model.ScreeningQuestions.Count > 0)
            {
                int idx = 0;
                foreach (var q in model.ScreeningQuestions)
                {
                    if (!string.IsNullOrWhiteSpace(q.QuestionText))
                    {
                        _context.JobScreeningQuestions.Add(new JobScreeningQuestion
                        {
                            JobId = job.Id,
                            QuestionText = q.QuestionText.Trim(),
                            QuestionType = NormalizeQuestionType(q.QuestionType),
                            IsRequired = q.IsRequired,
                            IdealAnswer = q.IdealAnswer?.Trim(),
                            OrderIndex = q.OrderIndex > 0 ? q.OrderIndex : idx
                        });
                        idx++;
                    }
                }
                await _context.SaveChangesAsync();
            }

            var createdJob = await _context.Jobs
                .Include(j => j.Company)
                .Include(j => j.Category)
                .Include(j => j.JobSkills).ThenInclude(js => js.Skill)
                .Include(j => j.ScreeningQuestions)
                .FirstOrDefaultAsync(j => j.Id == job.Id);

            return CreatedAtAction(nameof(GetJob), new { id = job.Id }, MapToResponseDto(createdJob ?? job));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Employer")]
        public async Task<IActionResult> UpdateJob(int id, [FromBody] JobDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var job = await _context.Jobs
                .Include(j => j.Company)
                .Include(j => j.ScreeningQuestions)
                .FirstOrDefaultAsync(j => j.Id == id);
            
            if (job == null) return NotFound();
            if (job.Company.EmployerId != userId) return Forbid(); // Ownership check

            if (job.Status != "Draft" && job.Status != "Rejected" && job.Status != "Published")
            {
                return BadRequest(new { message = $"Cannot edit job while in '{job.Status}' status. Only Draft, Rejected, or Published jobs can be edited." });
            }

            // Whitelist QuestionType (Text, YesNo, Number), max 10 questions, lengths <= 300
            var (isQuestionsValid, questionsError) = ValidateScreeningQuestions(model.ScreeningQuestions);
            if (!isQuestionsValid) return BadRequest(new { message = questionsError });

            if (job.CategoryId != model.CategoryId)
            {
                var newCat = await _context.Categories.FindAsync(model.CategoryId);
                if (newCat == null || !newCat.IsActive)
                {
                    return BadRequest(new { message = "Selected category is not active or does not exist." });
                }
            }

            if (job.Status == "Published")
            {
                job.Status = "PendingApproval";
            }

            job.Title = model.Title.Trim();
            job.Description = model.Description.Trim();
            job.Requirements = model.Requirements?.Trim();
            job.Responsibilities = model.Responsibilities?.Trim();
            job.Location = model.Location?.Trim();
            job.IsRemote = model.IsRemote;
            job.SalaryMin = model.SalaryMin;
            job.SalaryMax = model.SalaryMax;
            job.ExperienceMin = model.ExperienceMin;
            job.ExperienceMax = model.ExperienceMax;
            job.JobType = model.JobType?.Trim();
            job.CategoryId = model.CategoryId;
            job.Deadline = model.Deadline;

            if (model.ScreeningQuestions != null)
            {
                var existingQuestions = await _context.JobScreeningQuestions
                    .Where(q => q.JobId == id)
                    .ToListAsync();
                var questionIds = existingQuestions.Select(q => q.Id).ToList();
                var hasAnswers = await _context.ApplicationAnswers.AnyAsync(a => questionIds.Contains(a.QuestionId));

                if (!hasAnswers)
                {
                    _context.JobScreeningQuestions.RemoveRange(existingQuestions);
                    int idx = 0;
                    foreach (var q in model.ScreeningQuestions)
                    {
                        if (!string.IsNullOrWhiteSpace(q.QuestionText))
                        {
                            _context.JobScreeningQuestions.Add(new JobScreeningQuestion
                            {
                                JobId = job.Id,
                                QuestionText = q.QuestionText.Trim(),
                                QuestionType = NormalizeQuestionType(q.QuestionType),
                                IsRequired = q.IsRequired,
                                IdealAnswer = q.IdealAnswer?.Trim(),
                                OrderIndex = q.OrderIndex > 0 ? q.OrderIndex : idx
                            });
                            idx++;
                        }
                    }
                }
            }

            await _context.SaveChangesAsync();

            var updatedJob = await _context.Jobs
                .Include(j => j.Company)
                .Include(j => j.Category)
                .Include(j => j.JobSkills).ThenInclude(js => js.Skill)
                .Include(j => j.ScreeningQuestions)
                .FirstOrDefaultAsync(j => j.Id == job.Id);

            return Ok(MapToResponseDto(updatedJob ?? job));
        }

        [HttpPost("{id}/submit")]
        [Authorize(Roles = "Employer")]
        public async Task<IActionResult> SubmitJobForApproval(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var job = await _context.Jobs.Include(j => j.Company).FirstOrDefaultAsync(j => j.Id == id);
            
            if (job == null) return NotFound();
            if (job.Company.EmployerId != userId) return Forbid(); // Ownership check

            if (job.Company.VerificationStatus != "Verified") return BadRequest(new { message = "Your identity must be verified before submitting jobs." });
            if (!job.IsPaid) return BadRequest(new { message = "You must pay for this job post before submitting for approval." });
            if (job.Status != "Draft") return BadRequest(new { message = "Only draft jobs can be submitted." });

            job.Status = "PendingApproval";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Job submitted for approval.", status = job.Status });
        }

        [HttpPost("{id}/close")]
        [Authorize(Roles = "Employer,Admin")]
        public async Task<IActionResult> CloseJob(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");

            var job = await _context.Jobs.Include(j => j.Company).FirstOrDefaultAsync(j => j.Id == id);
            if (job == null) return NotFound();

            // Ownership check: employers can only close their own jobs
            if (!isAdmin && job.Company.EmployerId != userId) return Forbid();

            if (job.Status == "Closed")
            {
                return BadRequest(new { message = "Job is already closed." });
            }

            // Employer can only close Published jobs. Admin can close jobs in any status.
            if (!isAdmin && job.Status != "Published")
            {
                return BadRequest(new { message = $"Employers can only close published jobs. Current status is '{job.Status}'." });
            }

            job.Status = "Closed";
            if (isAdmin)
            {
                job.ClosedByAdmin = true;
            }
            else
            {
                job.ClosedByAdmin = false;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Job closed successfully.", status = job.Status });
        }

        [HttpPost("{id}/reopen")]
        [Authorize(Roles = "Employer,Admin")]
        public async Task<IActionResult> ReopenJob(int id, [FromBody] ReopenJobDto? model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");

            var job = await _context.Jobs.Include(j => j.Company).FirstOrDefaultAsync(j => j.Id == id);
            if (job == null) return NotFound();

            // Ownership check: employers can only reopen their own jobs
            if (!isAdmin && job.Company.EmployerId != userId) return Forbid();

            // Closed or Expired jobs only
            if (job.Status != "Closed" && job.Status != "Expired")
            {
                return BadRequest(new { message = $"Only closed or expired jobs can be reopened. This job is currently '{job.Status}'." });
            }

            if (!isAdmin)
            {
                // Employer reopening requirements
                if (job.ClosedByAdmin)
                {
                    return BadRequest(new { message = "This job was closed by an administrator and cannot be reopened by an employer." });
                }

                if (!job.PublishedAt.HasValue)
                {
                    return BadRequest(new { message = "Job must have been previously published to be reopened." });
                }

                if (!job.IsPaid)
                {
                    return BadRequest(new { message = "Job must be paid before it can be reopened." });
                }

                if (job.Company.VerificationStatus != "Verified" || !job.Company.IsApproved)
                {
                    return BadRequest(new { message = "Company must be verified and approved to reopen jobs." });
                }
            }

            // Expired deadline check: if status is Expired or deadline is expired, require a new future deadline
            bool isExpiredJob = job.Status == "Expired" || (job.Deadline.HasValue && job.Deadline.Value <= DateTime.UtcNow);
            if (isExpiredJob)
            {
                if (model == null || !model.Deadline.HasValue || model.Deadline.Value <= DateTime.UtcNow)
                {
                    return BadRequest(new
                    {
                        message = "Job deadline has expired. A new future deadline is required to reopen the job.",
                        requiresNewDeadline = true
                    });
                }
                job.Deadline = model.Deadline.Value;
            }
            else if (model?.Deadline.HasValue == true)
            {
                if (model.Deadline.Value <= DateTime.UtcNow)
                {
                    return BadRequest(new { message = "The new deadline must be a future date." });
                }
                job.Deadline = model.Deadline.Value;
            }

            job.Status = "Published";
            if (isAdmin)
            {
                job.ClosedByAdmin = false;
            }
            if (job.PublishedAt == null)
            {
                job.PublishedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Job reopened successfully.",
                status = job.Status,
                deadline = job.Deadline
            });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteJob(int id)
        {
            var job = await _context.Jobs.Include(j => j.Company).FirstOrDefaultAsync(j => j.Id == id);
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

            // 6. Clean up JobViews
            var jobViews = await _context.JobViews.Where(v => v.JobId == id).ToListAsync();
            _context.JobViews.RemoveRange(jobViews);

            _context.Jobs.Remove(job);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id}/duplicate")]
        [Authorize(Roles = "Employer,Admin")]
        public async Task<IActionResult> DuplicateJob(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");

            var originalJob = await _context.Jobs
                .Include(j => j.Company)
                .Include(j => j.JobSkills)
                .Include(j => j.ScreeningQuestions)
                .FirstOrDefaultAsync(j => j.Id == id);

            if (originalJob == null) return NotFound();
            if (!isAdmin && originalJob.Company.EmployerId != userId) return Forbid();

            // Validate original job screening questions before duplicating
            if (originalJob.ScreeningQuestions.Count > 10)
            {
                return BadRequest(new { message = "Original job has more than 10 screening questions and cannot be duplicated." });
            }
            foreach (var sq in originalJob.ScreeningQuestions)
            {
                if (sq.QuestionText.Length > 300)
                {
                    return BadRequest(new { message = "Original job has a screening question exceeding 300 characters and cannot be duplicated." });
                }
                if (!string.IsNullOrWhiteSpace(sq.IdealAnswer) && sq.IdealAnswer.Length > 300)
                {
                    return BadRequest(new { message = "Original job has a screening question ideal answer exceeding 300 characters and cannot be duplicated." });
                }
                if (!AllowedQuestionTypes.Contains(sq.QuestionType))
                {
                    return BadRequest(new { message = $"Original job has invalid question type '{sq.QuestionType}'." });
                }
            }

            var copyTitle = $"{originalJob.Title} (Copy)";
            if (copyTitle.Length > 200) copyTitle = copyTitle.Substring(0, 193) + " (Copy)";

            var copy = new Job
            {
                CompanyId = originalJob.CompanyId,
                Title = copyTitle,
                Description = originalJob.Description,
                Requirements = originalJob.Requirements,
                Responsibilities = originalJob.Responsibilities,
                Location = originalJob.Location,
                IsRemote = originalJob.IsRemote,
                SalaryMin = originalJob.SalaryMin,
                SalaryMax = originalJob.SalaryMax,
                ExperienceMin = originalJob.ExperienceMin,
                ExperienceMax = originalJob.ExperienceMax,
                JobType = originalJob.JobType,
                CategoryId = originalJob.CategoryId,
                Deadline = originalJob.Deadline.HasValue && originalJob.Deadline > DateTime.UtcNow 
                    ? originalJob.Deadline 
                    : DateTime.UtcNow.AddDays(30),
                Status = "Draft",
                IsPaid = false,
                ClosedByAdmin = false,
                PublishedAt = null,
                CreatedAt = DateTime.UtcNow
            };

            _context.Jobs.Add(copy);
            await _context.SaveChangesAsync();

            // Duplicate skills
            if (originalJob.JobSkills.Any())
            {
                foreach (var js in originalJob.JobSkills)
                {
                    _context.JobSkills.Add(new JobSkill
                    {
                        JobId = copy.Id,
                        SkillId = js.SkillId
                    });
                }
            }

            // Duplicate screening questions
            if (originalJob.ScreeningQuestions.Any())
            {
                foreach (var sq in originalJob.ScreeningQuestions.OrderBy(q => q.OrderIndex))
                {
                    _context.JobScreeningQuestions.Add(new JobScreeningQuestion
                    {
                        JobId = copy.Id,
                        QuestionText = sq.QuestionText.Trim(),
                        QuestionType = NormalizeQuestionType(sq.QuestionType),
                        IsRequired = sq.IsRequired,
                        IdealAnswer = sq.IdealAnswer?.Trim(),
                        OrderIndex = sq.OrderIndex
                    });
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Job duplicated successfully as draft.",
                jobId = copy.Id,
                title = copy.Title
            });
        }

        private static JobResponseDto MapToResponseDto(Job job)
        {
            return new JobResponseDto
            {
                Id = job.Id,
                CompanyId = job.CompanyId,
                Title = job.Title,
                Description = job.Description,
                Requirements = job.Requirements,
                Responsibilities = job.Responsibilities,
                Location = job.Location,
                IsRemote = job.IsRemote,
                SalaryMin = job.SalaryMin,
                SalaryMax = job.SalaryMax,
                ExperienceMin = job.ExperienceMin,
                ExperienceMax = job.ExperienceMax,
                JobType = job.JobType,
                CategoryId = job.CategoryId,
                Deadline = job.Deadline,
                Status = job.Status,
                CreatedAt = job.CreatedAt,
                IsPaid = job.IsPaid,
                ClosedByAdmin = job.ClosedByAdmin,
                PublishedAt = job.PublishedAt,
                IsExpired = job.Status == "Expired" || (job.Deadline.HasValue && job.Deadline.Value < DateTime.UtcNow),
                ViewsCount = job.Views?.Count ?? 0,
                ApplicantsCount = job.Applications?.Count ?? 0,
                Company = job.Company == null ? null : new JobCompanyDto
                {
                    Id = job.Company.Id,
                    CompanyName = job.Company.CompanyName,
                    LogoUrl = job.Company.LogoUrl,
                    Location = job.Company.Location,
                    Industry = job.Company.Industry,
                    Website = job.Company.Website,
                    Description = job.Company.Description,
                    CompanySize = job.Company.CompanySize,
                    IsApproved = job.Company.IsApproved
                },
                Category = job.Category == null ? null : new JobCategoryDto
                {
                    Id = job.Category.Id,
                    Name = job.Category.Name
                },
                Skills = job.JobSkills?.Select(js => js.Skill.Name).ToList() ?? new List<string>(),
                ScreeningQuestions = job.ScreeningQuestions?
                    .OrderBy(q => q.OrderIndex)
                    .Select(q => new ScreeningQuestionResponseDto
                    {
                        Id = q.Id,
                        QuestionText = q.QuestionText,
                        QuestionType = q.QuestionType,
                        IsRequired = q.IsRequired,
                        IdealAnswer = q.IdealAnswer,
                        OrderIndex = q.OrderIndex
                    }).ToList() ?? new List<ScreeningQuestionResponseDto>()
            };
        }

        private string ComputeIpHash(string ipAddress)
        {
            var salt = _configuration["Security:IpHashSalt"];
            if (string.IsNullOrWhiteSpace(salt))
            {
                throw new InvalidOperationException("Missing required configuration 'Security:IpHashSalt'.");
            }
            using var sha256 = System.Security.Cryptography.SHA256.Create();
            var bytes = System.Text.Encoding.UTF8.GetBytes(ipAddress + ":" + salt);
            var hashBytes = sha256.ComputeHash(bytes);
            return Convert.ToHexString(hashBytes).ToLowerInvariant();
        }

        private static readonly HashSet<string> AllowedQuestionTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "Text", "YesNo", "Number"
        };

        private static (bool IsValid, string? ErrorMessage) ValidateScreeningQuestions(List<ScreeningQuestionInputDto>? questions)
        {
            if (questions == null || questions.Count == 0) return (true, null);

            if (questions.Count > 10)
            {
                return (false, "A job can have a maximum of 10 screening questions.");
            }

            for (int i = 0; i < questions.Count; i++)
            {
                var q = questions[i];
                if (string.IsNullOrWhiteSpace(q.QuestionText))
                {
                    return (false, $"Screening question #{i + 1} text cannot be empty.");
                }

                var text = q.QuestionText.Trim();
                if (text.Length > 300)
                {
                    return (false, $"Screening question #{i + 1} text cannot exceed 300 characters.");
                }

                var type = string.IsNullOrWhiteSpace(q.QuestionType) ? "Text" : q.QuestionType.Trim();
                if (!AllowedQuestionTypes.Contains(type))
                {
                    return (false, $"Screening question #{i + 1} type '{type}' is invalid. Allowed types are: Text, YesNo, Number.");
                }

                if (!string.IsNullOrWhiteSpace(q.IdealAnswer) && q.IdealAnswer.Trim().Length > 300)
                {
                    return (false, $"Screening question #{i + 1} ideal answer cannot exceed 300 characters.");
                }
            }

            return (true, null);
        }

        private static string NormalizeQuestionType(string? type)
        {
            var trimmed = type?.Trim() ?? "Text";
            return AllowedQuestionTypes.FirstOrDefault(t => t.Equals(trimmed, StringComparison.OrdinalIgnoreCase)) ?? "Text";
        }
    }

    public class JobDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? Requirements { get; set; }
        public string? Responsibilities { get; set; }
        public string? Location { get; set; }
        public bool IsRemote { get; set; } = false;
        public decimal? SalaryMin { get; set; }
        public decimal? SalaryMax { get; set; }
        public int? ExperienceMin { get; set; }
        public int? ExperienceMax { get; set; }
        public string? JobType { get; set; }
        public int CategoryId { get; set; }
        public DateTime? Deadline { get; set; }
        public List<ScreeningQuestionInputDto>? ScreeningQuestions { get; set; }
    }

    public class ScreeningQuestionInputDto
    {
        public int? Id { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public string QuestionType { get; set; } = "Text"; // Text, YesNo, Number
        public bool IsRequired { get; set; } = true;
        public string? IdealAnswer { get; set; }
        public int OrderIndex { get; set; } = 0;
    }

    public class ReopenJobDto
    {
        public DateTime? Deadline { get; set; }
    }

    public class JobResponseDto
    {
        public int Id { get; set; }
        public int CompanyId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? Requirements { get; set; }
        public string? Responsibilities { get; set; }
        public string? Location { get; set; }
        public bool IsRemote { get; set; }
        public decimal? SalaryMin { get; set; }
        public decimal? SalaryMax { get; set; }
        public int? ExperienceMin { get; set; }
        public int? ExperienceMax { get; set; }
        public string? JobType { get; set; }
        public int CategoryId { get; set; }
        public DateTime? Deadline { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool IsPaid { get; set; }
        public bool ClosedByAdmin { get; set; }
        public DateTime? PublishedAt { get; set; }
        public bool IsExpired { get; set; }
        public int ViewsCount { get; set; }
        public int ApplicantsCount { get; set; }
        public JobCompanyDto? Company { get; set; }
        public JobCategoryDto? Category { get; set; }
        public List<string> Skills { get; set; } = new();
        public List<ScreeningQuestionResponseDto> ScreeningQuestions { get; set; } = new();
    }

    public class ScreeningQuestionResponseDto
    {
        public int Id { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public string QuestionType { get; set; } = "Text";
        public bool IsRequired { get; set; } = true;
        public string? IdealAnswer { get; set; }
        public int OrderIndex { get; set; }
    }

    public class JobCompanyDto
    {
        public int Id { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public string? Location { get; set; }
        public string? Industry { get; set; }
        public string? Website { get; set; }
        public string? Description { get; set; }
        public string? CompanySize { get; set; }
        public bool IsApproved { get; set; }
    }

    public class JobCategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }
}
