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
        public async Task<IActionResult> GetJobs([FromQuery] int page = 1, [FromQuery] int pageSize = 12, 
            [FromQuery] string? keyword = null, [FromQuery] string? location = null, 
            [FromQuery] int? category = null, [FromQuery] decimal? minSalary = null, 
            [FromQuery] decimal? maxSalary = null, [FromQuery] int? experience = null, 
            [FromQuery] string? jobType = null, [FromQuery] bool? remote = null,
            [FromQuery] int? companyId = null)
        {
            var query = _context.Jobs
                .Include(j => j.Company)
                .Include(j => j.Category)
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
                query = query.Where(j => j.Title.Contains(keyword) || j.Description.Contains(keyword));
            }
            if (!string.IsNullOrEmpty(location))
            {
                query = query.Where(j => j.Location!.Contains(location));
            }
            if (category.HasValue)
            {
                query = query.Where(j => j.CategoryId == category.Value);
            }
            if (minSalary.HasValue)
            {
                query = query.Where(j => j.SalaryMax >= minSalary.Value);
            }
            if (maxSalary.HasValue)
            {
                query = query.Where(j => j.SalaryMin <= maxSalary.Value);
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

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            var jobs = await query
                .OrderByDescending(j => j.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
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

            return Ok(job);
        }

        [HttpGet("my-jobs")]
        [Authorize(Roles = "Employer")]
        public async Task<IActionResult> GetMyJobs([FromQuery] int page = 1, [FromQuery] int pageSize = 12)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var query = _context.Jobs
                .Include(j => j.Company)
                .Include(j => j.Category)
                .Where(j => j.Company.EmployerId == userId)
                .AsQueryable();

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            var jobs = await query
                .OrderByDescending(j => j.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
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

        [HttpDelete("{id}")]
        [Authorize(Roles = "Employer,Admin")]
        public async Task<IActionResult> DeleteJob(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");

            var job = await _context.Jobs.Include(j => j.Company).FirstOrDefaultAsync(j => j.Id == id);
            if (job == null) return NotFound();

            if (!isAdmin && job.Company.EmployerId != userId) return Forbid(); // Ownership check

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
}
