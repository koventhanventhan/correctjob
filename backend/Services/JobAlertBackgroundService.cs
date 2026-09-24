using HireConnect.API.Data;
using HireConnect.API.Models;
using Microsoft.EntityFrameworkCore;

namespace HireConnect.API.Services
{
    public class JobAlertBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<JobAlertBackgroundService> _logger;
        // In dev, run frequently (e.g. 1 minute for easy testing). In prod, maybe 1 hour.
        private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(1);

        public JobAlertBackgroundService(IServiceProvider serviceProvider, ILogger<JobAlertBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("JobAlertBackgroundService starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessJobAlertsAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while processing job alerts.");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }

            _logger.LogInformation("JobAlertBackgroundService stopping.");
        }

        private async Task ProcessJobAlertsAsync(CancellationToken stoppingToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var alerts = await context.JobAlerts.ToListAsync(stoppingToken);

            foreach (var alert in alerts)
            {
                var query = context.Jobs
                    .Include(j => j.Company)
                    .Where(j => j.Status == "Published" && j.Company.IsApproved && j.CreatedAt > alert.LastCheckedAt);

                if (!string.IsNullOrEmpty(alert.Keyword))
                {
                    query = query.Where(j => j.Title.Contains(alert.Keyword) || j.Description.Contains(alert.Keyword));
                }
                if (!string.IsNullOrEmpty(alert.Location))
                {
                    query = query.Where(j => j.Location!.Contains(alert.Location));
                }
                if (alert.CategoryId.HasValue)
                {
                    query = query.Where(j => j.CategoryId == alert.CategoryId.Value);
                }
                if (!string.IsNullOrEmpty(alert.JobType))
                {
                    query = query.Where(j => j.JobType == alert.JobType);
                }

                var matchingJobs = await query.ToListAsync(stoppingToken);

                if (matchingJobs.Any())
                {
                    _logger.LogInformation($"Found {matchingJobs.Count} matching jobs for alert {alert.Id}");

                    foreach (var job in matchingJobs)
                    {
                        var notification = new Notification
                        {
                            UserId = alert.SeekerId,
                            Title = "New Job Alert Match",
                            Message = $"A new job matching your alert was posted: {job.Title} at {job.Company.CompanyName}.",
                            CreatedAt = DateTime.UtcNow
                        };
                        context.Notifications.Add(notification);
                    }
                }

                alert.LastCheckedAt = DateTime.UtcNow;
            }

            if (alerts.Any())
            {
                await context.SaveChangesAsync(stoppingToken);
            }
        }
    }
}
