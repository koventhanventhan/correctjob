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
    public class SavedJobsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SavedJobsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("{jobId}")]
        public async Task<IActionResult> SaveJob(int jobId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var seeker = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            
            if (seeker == null) return BadRequest("Please complete your profile first.");

            var exists = await _context.SavedJobs.AnyAsync(s => s.JobId == jobId && s.SeekerId == seeker.Id);
            if (exists) return Ok(new { message = "Job already saved" });

            var savedJob = new SavedJob
            {
                JobId = jobId,
                SeekerId = seeker.Id
            };

            _context.SavedJobs.Add(savedJob);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Job saved successfully" });
        }

        [HttpDelete("{jobId}")]
        public async Task<IActionResult> UnsaveJob(int jobId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var seeker = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (seeker == null) return BadRequest("Profile not found.");

            var savedJob = await _context.SavedJobs.FirstOrDefaultAsync(s => s.JobId == jobId && s.SeekerId == seeker.Id);
            if (savedJob == null) return NotFound("Saved job not found.");

            _context.SavedJobs.Remove(savedJob);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Job unsaved successfully" });
        }

        [HttpGet("my-saved")]
        public async Task<IActionResult> GetMySavedJobs([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var seeker = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (seeker == null) return Ok(new { data = new List<object>(), totalCount = 0 });

            var query = _context.SavedJobs
                .Include(s => s.Job)
                .ThenInclude(j => j.Company)
                .Where(s => s.SeekerId == seeker.Id);

            var totalCount = await query.CountAsync();
            var savedJobs = await query
                .OrderByDescending(s => s.SavedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new { data = savedJobs, totalCount });
        }
        [HttpGet("check/{jobId}")]
        public async Task<IActionResult> CheckSaved(int jobId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var seeker = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (seeker == null) return Ok(new { isSaved = false });

            var exists = await _context.SavedJobs.AnyAsync(s => s.JobId == jobId && s.SeekerId == seeker.Id);
            return Ok(new { isSaved = exists });
        }
    }
}
