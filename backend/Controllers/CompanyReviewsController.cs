using System.Security.Claims;
using HireConnect.API.Data;
using HireConnect.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HireConnect.API.Controllers
{
    [ApiController]
    [Route("api")]
    public class CompanyReviewsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CompanyReviewsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("companies/{companyId}/reviews")]
        public async Task<IActionResult> GetCompanyReviews(int companyId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var query = _context.CompanyReviews
                .Include(r => r.Seeker)
                .Where(r => r.CompanyId == companyId && !r.IsHidden);

            var totalCount = await query.CountAsync();
            var reviews = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new
                {
                    r.Id,
                    r.CompanyId,
                    r.SeekerId,
                    SeekerName = r.Seeker.FullName, // Don't expose full user object
                    r.Rating,
                    r.Headline,
                    r.Description,
                    r.CreatedAt
                })
                .ToListAsync();

            var averageRating = totalCount > 0 ? await query.AverageAsync(r => r.Rating) : 0;

            return Ok(new { data = reviews, totalCount, averageRating });
        }

        [Authorize(Roles = "JobSeeker")]
        [HttpPost("companies/{companyId}/reviews")]
        public async Task<IActionResult> CreateReview(int companyId, [FromBody] CreateReviewDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // 1. Check if Company exists
            var companyExists = await _context.Companies.AnyAsync(c => c.Id == companyId);
            if (!companyExists) return NotFound("Company not found.");

            // 2. Eligibility: Seeker must have applied to at least one job by this company
            var seekerProfile = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (seekerProfile == null)
            {
                return BadRequest(new { message = "Seeker profile not found." });
            }

            var hasApplied = await _context.Applications
                .Include(a => a.Job)
                .AnyAsync(a => a.SeekerId == seekerProfile.Id && a.Job.CompanyId == companyId);
            
            if (!hasApplied)
            {
                return BadRequest(new { message = "You can only review a company if you have applied to at least one of their jobs." });
            }

            // 3. Unique constraint: Only one review per user per company
            var existingReview = await _context.CompanyReviews
                .AnyAsync(r => r.CompanyId == companyId && r.SeekerId == userId);
            
            if (existingReview)
            {
                return BadRequest(new { message = "You have already submitted a review for this company." });
            }

            var review = new CompanyReview
            {
                CompanyId = companyId,
                SeekerId = userId!,
                Rating = model.Rating,
                Headline = model.Headline,
                Description = model.Description
            };

            _context.CompanyReviews.Add(review);
            await _context.SaveChangesAsync();

            return Ok(review);
        }

        // Admin Endpoints for Moderation
        [Authorize(Roles = "Admin")]
        [HttpGet("admin/reviews")]
        public async Task<IActionResult> GetAllReviews([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var query = _context.CompanyReviews
                .Include(r => r.Seeker)
                .Include(r => r.Company)
                .AsQueryable();

            var totalCount = await query.CountAsync();
            var reviews = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new
                {
                    r.Id,
                    CompanyName = r.Company.CompanyName,
                    r.CompanyId,
                    SeekerName = r.Seeker.FullName,
                    r.Rating,
                    r.Headline,
                    r.Description,
                    r.IsHidden,
                    r.CreatedAt
                })
                .ToListAsync();

            return Ok(new { data = reviews, totalCount });
        }

        [Authorize(Roles = "Admin")]
        [HttpPatch("admin/reviews/{id}/toggle-visibility")]
        public async Task<IActionResult> ToggleVisibility(int id)
        {
            var review = await _context.CompanyReviews.FindAsync(id);
            if (review == null) return NotFound();

            review.IsHidden = !review.IsHidden;
            await _context.SaveChangesAsync();

            return Ok(review);
        }
    }

    public class CreateReviewDto
    {
        public int Rating { get; set; }
        public string Headline { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}
