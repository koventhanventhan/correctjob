using HireConnect.API.Data;
using HireConnect.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HireConnect.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")] // Global admin auth
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var query = _context.Users.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(u => u.FullName.Contains(search) || u.Email.Contains(search));
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
                .ToListAsync();

            return Ok(new { data = jobs, totalCount });
        }

        [HttpPatch("jobs/{id}/approve")]
        public async Task<IActionResult> ApproveJob(int id, [FromBody] string status = "Approved")
        {
            var job = await _context.Jobs.FindAsync(id);
            if (job == null) return NotFound();

            // Status State Machine validation can be more complex, but simplified here
            job.Status = status; 
            await _context.SaveChangesAsync();
            return Ok(job);
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
                .ToListAsync();

            return Ok(new { data = companies, totalCount });
        }

        [HttpPatch("companies/{id}/approve")]
        public async Task<IActionResult> ApproveCompany(int id, [FromBody] bool isApproved = true)
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null) return NotFound();

            company.IsApproved = isApproved;
            await _context.SaveChangesAsync();
            return Ok(company);
        }

        [HttpPatch("users/{id}/block")]
        public async Task<IActionResult> BlockUser(string id, [FromBody] bool isActive = false)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            user.IsActive = isActive;
            await _context.SaveChangesAsync();
            return Ok(user);
        }

        [HttpDelete("jobs/{id}")]
        public async Task<IActionResult> DeleteJob(int id)
        {
            var job = await _context.Jobs.FindAsync(id);
            if (job == null) return NotFound();

            _context.Jobs.Remove(job);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
