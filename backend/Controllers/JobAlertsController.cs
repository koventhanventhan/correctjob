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
    [Authorize(Roles = "JobSeeker")]
    public class JobAlertsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public JobAlertsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateAlert([FromBody] CreateJobAlertDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var seeker = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (seeker == null) return BadRequest("Profile must be created first.");

            var alert = new JobAlert
            {
                SeekerId = userId!,
                Keyword = model.Keyword,
                Location = model.Location,
                CategoryId = model.CategoryId,
                JobType = model.JobType,
                CreatedAt = DateTime.UtcNow,
                LastCheckedAt = DateTime.UtcNow
            };

            _context.JobAlerts.Add(alert);
            await _context.SaveChangesAsync();

            return Ok(alert);
        }

        [HttpGet("my-alerts")]
        public async Task<IActionResult> GetMyAlerts()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            var alerts = await _context.JobAlerts
                .Include(a => a.Category)
                .Where(a => a.SeekerId == userId)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return Ok(alerts);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAlert(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var alert = await _context.JobAlerts.FirstOrDefaultAsync(a => a.Id == id);
            
            if (alert == null) return NotFound();
            if (alert.SeekerId != userId) return Forbid();

            _context.JobAlerts.Remove(alert);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Alert deleted." });
        }
    }

    public class CreateJobAlertDto
    {
        public string? Keyword { get; set; }
        public string? Location { get; set; }
        public int? CategoryId { get; set; }
        public string? JobType { get; set; }
    }
}
