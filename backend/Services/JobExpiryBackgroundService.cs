using HireConnect.API.Data;
using HireConnect.API.Models;
using Microsoft.EntityFrameworkCore;

namespace HireConnect.API.Services
{
    public class JobExpiryBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<JobExpiryBackgroundService> _logger;
        // In dev, run frequently (e.g. 1 minute for easy testing).
        private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(1);

        public JobExpiryBackgroundService(IServiceProvider serviceProvider, ILogger<JobExpiryBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("JobExpiryBackgroundService starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessJobExpiriesAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while processing job expiry alerts.");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }

            _logger.LogInformation("JobExpiryBackgroundService stopping.");
        }

        public async Task<int> ProcessJobExpiriesAsync(CancellationToken stoppingToken = default)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var now = DateTime.UtcNow;
            var threeDaysFromNow = now.AddDays(3);

            // 1. Mark Published jobs whose deadline has passed as Status = "Expired" (no audit/notification)
            var expiredJobs = await context.Jobs
                .Where(j => j.Status == "Published" &&
                            j.Deadline.HasValue &&
                            j.Deadline.Value <= now)
                .ToListAsync(stoppingToken);

            foreach (var job in expiredJobs)
            {
                job.Status = "Expired";
                _logger.LogInformation("Job {JobId} deadline passed ({Deadline}); status updated to Expired", job.Id, job.Deadline);
            }

            if (expiredJobs.Count > 0)
            {
                await context.SaveChangesAsync(stoppingToken);
            }

            // 2. Find Published jobs whose deadline is within 3 days and not yet expired (alerts)
            var expiringJobs = await context.Jobs
                .Include(j => j.Company)
                .Where(j => j.Status == "Published" &&
                            j.Deadline.HasValue &&
                            j.Deadline.Value > now &&
                            j.Deadline.Value <= threeDaysFromNow &&
                            j.Company != null &&
                            !string.IsNullOrEmpty(j.Company.EmployerId))
                .ToListAsync(stoppingToken);

            int notificationsCreated = 0;

            foreach (var job in expiringJobs)
            {
                var employerId = job.Company.EmployerId;
                var deadlineStr = job.Deadline!.Value.ToString("yyyy-MM-dd");
                var uniqueMarker = $"[Job #{job.Id}:{deadlineStr}]";

                // Duplicate check: Verify if employer already received an expiry notification for this job and deadline
                var alreadyNotified = await context.Notifications.AnyAsync(n =>
                    n.UserId == employerId &&
                    n.Title == "Job Expiring Soon" &&
                    n.Message.Contains(uniqueMarker),
                    stoppingToken);

                if (!alreadyNotified)
                {
                    var daysLeft = Math.Max(1, (int)Math.Ceiling((job.Deadline.Value - now).TotalDays));
                    var notification = new Notification
                    {
                        UserId = employerId,
                        Title = "Job Expiring Soon",
                        Message = $"Your job posting '{job.Title}' {uniqueMarker} will expire in {daysLeft} day(s) on {job.Deadline.Value:MMM dd, yyyy}. Consider reviewing candidates or extending the deadline if you are still hiring.",
                        CreatedAt = DateTime.UtcNow,
                        IsRead = false
                    };

                    context.Notifications.Add(notification);
                    notificationsCreated++;
                    _logger.LogInformation("Queued expiry alert for Job {JobId} to employer {EmployerId}", job.Id, employerId);
                }
            }

            if (notificationsCreated > 0)
            {
                await context.SaveChangesAsync(stoppingToken);
            }

            return notificationsCreated;
        }
    }
}
