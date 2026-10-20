using HireConnect.API.Data;
using HireConnect.API.DTOs.Payment;
using HireConnect.API.Models;
using HireConnect.API.Services;
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
        private readonly IConfiguration _config;
        private readonly ISystemSettingService _settingsService;

        public PaymentsController(
            AppDbContext context,
            IPaymentGatewayService paymentGateway,
            IConfiguration config,
            ISystemSettingService settingsService)
        {
            _context = context;
            _paymentGateway = paymentGateway;
            _config = config;
            _settingsService = settingsService;
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

            // Fetch dynamic job posting fee from system settings
            var postingFee = await _settingsService.GetJobPostingFeeAsync();

            // Create pending payment (Amount is locked in at creation time)
            var payment = new Payment
            {
                JobId = job.Id,
                EmployerId = userId,
                OrderId = $"JOB-{job.Id}-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}",
                Amount = postingFee,
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
            // 1. Verify hash signature
            bool isValid = _paymentGateway.VerifyNotification(notifyDto);
            if (!isValid)
            {
                return BadRequest(new { message = "Invalid signature." });
            }

            // 2. Verify merchant_id matches configured merchant
            var configuredMerchantId = _config["PayHere:MerchantId"];
            if (!string.IsNullOrEmpty(configuredMerchantId) &&
                !string.Equals(notifyDto.merchant_id, configuredMerchantId, StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "Merchant ID does not match configured merchant." });
            }

            // 3. Find payment record by OrderId
            var payment = await _context.Payments.FirstOrDefaultAsync(p => p.OrderId == notifyDto.order_id);
            if (payment == null) return NotFound(new { message = "Payment order not found." });

            // 4. Verify amount matches stored payment
            if (!decimal.TryParse(notifyDto.payhere_amount, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var notifyAmount) ||
                Math.Abs(notifyAmount - payment.Amount) > 0.01m)
            {
                return BadRequest(new { message = "Payment amount does not match stored order amount." });
            }

            // 5. Verify currency matches stored payment
            if (!string.Equals(notifyDto.payhere_currency, payment.Currency, StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "Payment currency does not match stored order currency." });
            }

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
