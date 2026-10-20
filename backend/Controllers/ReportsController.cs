using HireConnect.API.Data;
using HireConnect.API.DTOs.Report;
using HireConnect.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HireConnect.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ReportsController> _logger;

        public ReportsController(AppDbContext context, ILogger<ReportsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> CreateReport([FromBody] CreateReportDto request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Exactly one target must be specified: either JobId OR ReviewId
            var hasJob = request.JobId.HasValue && request.JobId.Value > 0;
            var hasReview = request.ReviewId.HasValue && request.ReviewId.Value > 0;

            if ((!hasJob && !hasReview) || (hasJob && hasReview))
            {
                return BadRequest(new { message = "You must report either a Job or a Review, not both or neither." });
            }

            // Reason character limit (max 500 chars)
            var reason = request.Reason.Trim();
            if (reason.Length > 500)
            {
                return BadRequest(new { message = "Report reason cannot exceed 500 characters." });
            }

            // Rate limit: maximum 10 reports per user within a 24-hour window
            var past24Hours = DateTime.UtcNow.AddHours(-24);
            var reportCountInLast24Hours = await _context.Reports
                .CountAsync(r => r.UserId == userId && r.CreatedAt >= past24Hours);

            if (reportCountInLast24Hours >= 10)
            {
                return StatusCode(StatusCodes.Status429TooManyRequests, new 
                { 
                    message = "Daily report limit reached. You can submit a maximum of 10 reports within 24 hours." 
                });
            }

            // Verify target existence and duplicate prevention (one report per user per job/review)
            if (hasJob)
            {
                var jobId = request.JobId!.Value;
                var jobExists = await _context.Jobs.AnyAsync(j => j.Id == jobId);
                if (!jobExists)
                {
                    return NotFound(new { message = "The specified job does not exist." });
                }

                var alreadyReportedJob = await _context.Reports
                    .AnyAsync(r => r.UserId == userId && r.JobId == jobId);

                if (alreadyReportedJob)
                {
                    return Conflict(new { message = "You have already submitted a report for this job." });
                }
            }
            else
            {
                var reviewId = request.ReviewId!.Value;
                var reviewExists = await _context.CompanyReviews.AnyAsync(r => r.Id == reviewId);
                if (!reviewExists)
                {
                    return NotFound(new { message = "The specified review does not exist." });
                }

                var alreadyReportedReview = await _context.Reports
                    .AnyAsync(r => r.UserId == userId && r.ReviewId == reviewId);

                if (alreadyReportedReview)
                {
                    return Conflict(new { message = "You have already submitted a report for this review." });
                }
            }

            var report = new Report
            {
                UserId = userId,
                JobId = hasJob ? request.JobId : null,
                ReviewId = hasReview ? request.ReviewId : null,
                Reason = reason,
                Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.Reports.Add(report);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Your report has been submitted for review. Thank you for helping keep our community safe.",
                reportId = report.Id
            });
        }

        [HttpGet("my")]
        public async Task<IActionResult> GetMyReports()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var reports = await _context.Reports
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.JobId,
                    JobTitle = r.Job != null ? r.Job.Title : null,
                    r.ReviewId,
                    r.Reason,
                    r.Description,
                    r.Status,
                    r.CreatedAt
                })
                .ToListAsync();

            return Ok(reports);
        }
    }
}
