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
    public class CompaniesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CompaniesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetCompanies([FromQuery] int page = 1, [FromQuery] int pageSize = 12)
        {
            // Public can only see approved companies
            var query = _context.Companies.Where(c => c.IsApproved);
            
            var totalCount = await query.CountAsync();
            var companies = await query
                .OrderBy(c => c.CompanyName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new { data = companies, totalCount });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCompany(int id)
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null || !company.IsApproved) return NotFound();

            return Ok(company);
        }

        [HttpGet("my-company")]
        [Authorize(Roles = "Employer")]
        public async Task<IActionResult> GetMyCompany()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.EmployerId == userId);
            
            if (company == null) return NotFound();
            return Ok(company);
        }

        [HttpPost]
        [Authorize(Roles = "Employer")]
        public async Task<IActionResult> CreateCompany([FromBody] CompanyDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var existing = await _context.Companies.FirstOrDefaultAsync(c => c.EmployerId == userId);
            if (existing != null) return BadRequest("You already have a company profile.");

            var company = new Company
            {
                EmployerId = userId!,
                CompanyName = model.CompanyName,
                Description = model.Description,
                Industry = model.Industry,
                Location = model.Location,
                CompanySize = model.CompanySize,
                Website = model.Website,
                IsApproved = false // Needs Admin approval
            };

            _context.Companies.Add(company);
            await _context.SaveChangesAsync();

            return Ok(company);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Employer")]
        public async Task<IActionResult> UpdateCompany(int id, [FromBody] CompanyDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var company = await _context.Companies.FindAsync(id);
            
            if (company == null) return NotFound();
            if (company.EmployerId != userId) return Forbid(); // Ownership check

            company.CompanyName = model.CompanyName;
            company.Description = model.Description;
            company.Industry = model.Industry;
            company.Location = model.Location;
            company.CompanySize = model.CompanySize;
            company.Website = model.Website;

            await _context.SaveChangesAsync();
            return Ok(company);
        }
    }

    public class CompanyDto
    {
        public string CompanyName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Industry { get; set; }
        public string? Location { get; set; }
        public string? CompanySize { get; set; }
        public string? Website { get; set; }
    }
}
