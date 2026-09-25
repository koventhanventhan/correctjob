using HireConnect.API.Data;
using HireConnect.API.DTOs.Payment;
using HireConnect.API.Models;
using HireConnect.API.Services.Payment;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HireConnect.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPaymentGatewayService _paymentGateway;

        public PaymentsController(AppDbContext context, IPaymentGatewayService paymentGateway)
        {
            _context = context;
            _paymentGateway = paymentGateway;
        }

        [HttpPost("create-order")]
        [Authorize(Roles = "Employer")]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequestDto request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var job = await _context.Jobs.Include(j => j.Company).FirstOrDefaultAsync(j => j.Id == request.JobId);
            if (job == null) return NotFound(new { message = "Job not found." });

            if (job.Company.EmployerId != userId)
                return Forbid();

            if (job.IsPaid)
                return BadRequest(new { message = "Job is already paid." });

            // Create pending payment
            var payment = new Payment
            {
                JobId = job.Id,
                EmployerId = userId,
                OrderId = $"JOB-{job.Id}-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}",
                Amount = 5000.00m, // Flat fee: 5000 LKR
                Currency = "LKR",
                Status = "Pending"
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            // Generate gateway specific payload
            var response = _paymentGateway.GenerateOrder(payment);
            return Ok(response);
        }

        [HttpPost("notify")]
        [Consumes("application/x-www-form-urlencoded")]
        public async Task<IActionResult> Notify([FromForm] PayHereNotifyRequestDto notifyDto)
        {
            // Verify hash
            bool isValid = _paymentGateway.VerifyNotification(notifyDto);
            if (!isValid)
            {
                return BadRequest(new { message = "Invalid signature." });
            }

            var payment = await _context.Payments.FirstOrDefaultAsync(p => p.OrderId == notifyDto.order_id);
            if (payment == null) return NotFound();

            if (notifyDto.status_code == "2") // Success
            {
                payment.Status = "Completed";
                payment.CompletedAt = DateTime.UtcNow;

                var job = await _context.Jobs.FindAsync(payment.JobId);
                if (job != null)
                {
                    job.IsPaid = true;
                }

                await _context.SaveChangesAsync();
                return Ok();
            }
            else if (notifyDto.status_code == "-1" || notifyDto.status_code == "-2" || notifyDto.status_code == "-3")
            {
                payment.Status = "Failed";
                await _context.SaveChangesAsync();
                return Ok();
            }

            return Ok(); // Acknowledge other statuses
        }

        [HttpGet("status/{jobId}")]
        [Authorize(Roles = "Employer")]
        public async Task<IActionResult> GetPaymentStatus(int jobId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var job = await _context.Jobs.Include(j => j.Company).FirstOrDefaultAsync(j => j.Id == jobId);
            if (job == null) return NotFound();

            if (job.Company.EmployerId != userId) return Forbid();

            return Ok(new { isPaid = job.IsPaid });
        }
    }
}
