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

        [HttpPost("verify-identity")]
        [Authorize(Roles = "Employer")]
        public async Task<IActionResult> VerifyIdentity([FromForm] IFormFile? idCardFront, [FromForm] IFormFile? idCardBack)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.EmployerId == userId);
            if (company == null) return NotFound("Company profile not found.");

            if (idCardFront == null || idCardBack == null)
            {
                return BadRequest(new { message = "Both front and back of the ID card are required." });
            }

            var allowedTypes = new[] { "image/jpeg", "image/png", "application/pdf" };
            if (!allowedTypes.Contains(idCardFront.ContentType) || !allowedTypes.Contains(idCardBack.ContentType))
            {
                return BadRequest(new { message = "Only JPG, PNG, or PDF files are allowed." });
            }

            if (idCardFront.Length > 5 * 1024 * 1024 || idCardBack.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new { message = "File size cannot exceed 5MB." });
            }

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", "IdCards");
            Directory.CreateDirectory(uploadsFolder);

            var frontFileName = $"{Guid.NewGuid()}_{Path.GetFileName(idCardFront.FileName)}";
            var backFileName = $"{Guid.NewGuid()}_{Path.GetFileName(idCardBack.FileName)}";

            using (var stream = new FileStream(Path.Combine(uploadsFolder, frontFileName), FileMode.Create))
            {
                await idCardFront.CopyToAsync(stream);
            }
            using (var stream = new FileStream(Path.Combine(uploadsFolder, backFileName), FileMode.Create))
            {
                await idCardBack.CopyToAsync(stream);
            }

            company.IdCardFrontUrl = frontFileName;
            company.IdCardBackUrl = backFileName;
            company.VerificationStatus = "Pending";
            company.VerificationNotes = null;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Identity verification submitted successfully.", status = company.VerificationStatus });
        }

        [HttpGet("id-card/{side}")]
        [Authorize]
        public async Task<IActionResult> DownloadIdCard(string side, [FromQuery] int companyId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");

            var company = await _context.Companies.FirstOrDefaultAsync(c => c.Id == companyId);
            if (company == null) return NotFound();

            if (!isAdmin && company.EmployerId != userId)
            {
                return Forbid();
            }

            var fileName = side.ToLower() == "front" ? company.IdCardFrontUrl : company.IdCardBackUrl;
            if (string.IsNullOrEmpty(fileName)) return NotFound();

            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", "IdCards", fileName);
            if (!System.IO.File.Exists(filePath)) return NotFound();

            var provider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(filePath, out var contentType))
            {
                contentType = "application/octet-stream";
            }

            var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
            return File(fileStream, contentType, fileName);
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
