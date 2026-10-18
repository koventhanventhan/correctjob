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
    public class JobsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public JobsController(AppDbContext context)
        {
            _context = context;
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
                if (isEmployer)
                {
                    query = query.Where(j => (j.Status == "Published" && j.Company.IsApproved) || j.Company.EmployerId == userId);
                }
                else
                {
                    query = query.Where(j => j.Status == "Published" && j.Company.IsApproved);
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
                query = query.Where(j => (j.Location != null && j.Location.Contains("Remote")) || 
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

            if (!isAdmin)
            {
                bool isOwnJob = isEmployer && job.Company.EmployerId == userId;
                if (!isOwnJob && (job.Status != "Published" || !job.Company.IsApproved))
                {
                    return Forbid();
                }
            }

            var dto = new JobResponseDto
            {
                Id = job.Id,
                CompanyId = job.CompanyId,
                Title = job.Title,
                Description = job.Description,
                Requirements = job.Requirements,
                Responsibilities = job.Responsibilities,
                Location = job.Location,
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
                        OrderIndex = q.OrderIndex
                    }).ToList()
            };

            return Ok(dto);
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

        [HttpGet("my-jobs")]
        [Authorize(Roles = "Employer")]
        public async Task<IActionResult> GetMyJobs([FromQuery] int page = 1, [FromQuery] int pageSize = 12)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var query = _context.Jobs
                .Include(j => j.Company)
                .Include(j => j.Category)
                .Include(j => j.JobSkills)
                .ThenInclude(js => js.Skill)
                .Where(j => j.Company.EmployerId == userId)
                .AsQueryable();

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

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

        [HttpPost]
        [Authorize(Roles = "Employer")]
        public async Task<IActionResult> CreateJob([FromBody] JobDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.EmployerId == userId);
            
            if (company == null) return BadRequest(new { message = "You must create a company profile first." });
            if (company.VerificationStatus != "Verified") return BadRequest(new { message = "Your identity must be verified before posting jobs." });
            if (!company.IsApproved) return Forbid(); // "An Employer's company must be Admin-approved before it can post jobs at all."

            var job = new Job
            {
                CompanyId = company.Id,
                Title = model.Title,
                Description = model.Description,
                Requirements = model.Requirements,
                Responsibilities = model.Responsibilities,
                Location = model.Location,
                SalaryMin = model.SalaryMin,
                SalaryMax = model.SalaryMax,
                ExperienceMin = model.ExperienceMin,
                ExperienceMax = model.ExperienceMax,
                JobType = model.JobType,
                CategoryId = model.CategoryId,
                Deadline = model.Deadline,
                Status = "Draft" // Strict state machine starts at Draft
            };

            _context.Jobs.Add(job);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetJob), new { id = job.Id }, job);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Employer")]
        public async Task<IActionResult> UpdateJob(int id, [FromBody] JobDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var job = await _context.Jobs.Include(j => j.Company).FirstOrDefaultAsync(j => j.Id == id);
            
            if (job == null) return NotFound();
            if (job.Company.EmployerId != userId) return Forbid(); // Ownership check

            if (job.Status != "Draft" && job.Status != "Rejected" && job.Status != "Published")
            {
                return BadRequest(new { message = $"Cannot edit job while in '{job.Status}' status. Only Draft, Rejected, or Published jobs can be edited." });
            }

            if (job.Status == "Published")
            {
                job.Status = "PendingApproval";
            }

            job.Title = model.Title;
            job.Description = model.Description;
            job.Requirements = model.Requirements;
            job.Responsibilities = model.Responsibilities;
            job.Location = model.Location;
            job.SalaryMin = model.SalaryMin;
            job.SalaryMax = model.SalaryMax;
            job.ExperienceMin = model.ExperienceMin;
            job.ExperienceMax = model.ExperienceMax;
            job.JobType = model.JobType;
            job.CategoryId = model.CategoryId;
            job.Deadline = model.Deadline;

            await _context.SaveChangesAsync();
            return Ok(job);
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

            return Ok(job);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Employer,Admin")]
        public async Task<IActionResult> DeleteJob(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");

            var job = await _context.Jobs.Include(j => j.Company).FirstOrDefaultAsync(j => j.Id == id);
            if (job == null) return NotFound();

            if (!isAdmin && job.Company.EmployerId != userId) return Forbid(); // Ownership check

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
    }

    public class JobDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? Requirements { get; set; }
        public string? Responsibilities { get; set; }
        public string? Location { get; set; }
        public decimal? SalaryMin { get; set; }
        public decimal? SalaryMax { get; set; }
        public int? ExperienceMin { get; set; }
        public int? ExperienceMax { get; set; }
        public string? JobType { get; set; }
        public int CategoryId { get; set; }
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
