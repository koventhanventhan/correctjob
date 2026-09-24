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
        public async Task<IActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var users = await _context.Users
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new { u.Id, u.FullName, u.Email, u.IsActive })
                .ToListAsync();
            return Ok(users);
        }

        [HttpGet("jobs")]
        public async Task<IActionResult> GetJobs([FromQuery] string? status)
        {
            var query = _context.Jobs.Include(j => j.Company).AsQueryable();
            if (!string.IsNullOrEmpty(status)) query = query.Where(j => j.Status == status);

            var jobs = await query.OrderByDescending(j => j.CreatedAt).ToListAsync();
            return Ok(jobs);
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
