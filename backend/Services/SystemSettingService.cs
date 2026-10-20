using HireConnect.API.Data;
using HireConnect.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System.Globalization;

namespace HireConnect.API.Services
{
    public class SystemSettingService : ISystemSettingService
    {
        private readonly AppDbContext _context;
        private readonly IMemoryCache _cache;
        private readonly IAuditLogService _auditLogService;
        private readonly ILogger<SystemSettingService> _logger;

        public const decimal MinJobPostingFee = 0.00m;
        public const decimal MaxJobPostingFee = 1000000.00m;
        public const decimal DefaultJobPostingFee = 5000.00m;

        private const string CacheKeyPrefix = "SysSetting_";
        private static readonly TimeSpan CacheDuration = TimeSpan.FromSeconds(10);

        public SystemSettingService(
            AppDbContext context,
            IMemoryCache cache,
            IAuditLogService auditLogService,
            ILogger<SystemSettingService> logger)
        {
            _context = context;
            _cache = cache;
            _auditLogService = auditLogService;
            _logger = logger;
        }

        public async Task<decimal> GetJobPostingFeeAsync()
        {
            var rawValue = await GetSettingAsync("JobPostingFee", DefaultJobPostingFee.ToString("F2", CultureInfo.InvariantCulture));
            if (decimal.TryParse(rawValue, NumberStyles.Any, CultureInfo.InvariantCulture, out var fee))
            {
                if (fee >= MinJobPostingFee && fee <= MaxJobPostingFee)
                {
                    return fee;
                }
            }
            return DefaultJobPostingFee;
        }

        public async Task<(bool Success, string? ErrorMessage)> SetJobPostingFeeAsync(decimal fee, string? adminId)
        {
            if (fee < MinJobPostingFee || fee > MaxJobPostingFee)
            {
                return (false, $"Job posting fee must be between {MinJobPostingFee:N2} and {MaxJobPostingFee:N2} LKR.");
            }

            var previousFee = await GetJobPostingFeeAsync();
            var feeStr = fee.ToString("F2", CultureInfo.InvariantCulture);

            await SetSettingAsync("JobPostingFee", feeStr, adminId, "Fee charged for posting a job in LKR");

            if (!string.IsNullOrEmpty(adminId))
            {
                await _auditLogService.LogAsync(
                    adminId,
                    "SETTING_JOB_POSTING_FEE_UPDATED",
                    "SystemSetting",
                    "JobPostingFee",
                    $"Changed JobPostingFee from {previousFee:N2} LKR to {fee:N2} LKR"
                );
            }

            return (true, null);
        }

        public async Task<bool> IsMaintenanceModeAsync()
        {
            var rawValue = await GetSettingAsync("MaintenanceMode", "false");
            return bool.TryParse(rawValue, out var isMaintenance) && isMaintenance;
        }

        public async Task SetMaintenanceModeAsync(bool enabled, string? adminId)
        {
            var previous = await IsMaintenanceModeAsync();
            var valStr = enabled.ToString().ToLowerInvariant();

            await SetSettingAsync("MaintenanceMode", valStr, adminId, "Platform maintenance mode toggle (true/false)");

            if (!string.IsNullOrEmpty(adminId))
            {
                await _auditLogService.LogAsync(
                    adminId,
                    "SETTING_MAINTENANCE_MODE_UPDATED",
                    "SystemSetting",
                    "MaintenanceMode",
                    $"Maintenance mode changed from '{previous}' to '{enabled}'"
                );
            }
        }

        public async Task<string> GetSettingAsync(string key, string defaultValue = "")
        {
            var cacheKey = CacheKeyPrefix + key;
            if (_cache.TryGetValue(cacheKey, out string? cached) && cached != null)
            {
                return cached;
            }

            try
            {
                var setting = await _context.SystemSettings.AsNoTracking().FirstOrDefaultAsync(s => s.Key == key);
                var value = setting?.Value ?? defaultValue;

                _cache.Set(cacheKey, value, CacheDuration);
                return value;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch system setting '{Key}'. Returning default value.", key);
                return defaultValue;
            }
        }

        public async Task SetSettingAsync(string key, string value, string? adminId = null, string? description = null)
        {
            var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == key);
            if (setting == null)
            {
                setting = new SystemSetting
                {
                    Key = key,
                    Value = value,
                    Description = description,
                    UpdatedAt = DateTime.UtcNow,
                    UpdatedByAdminId = adminId
                };
                _context.SystemSettings.Add(setting);
            }
            else
            {
                setting.Value = value;
                if (!string.IsNullOrEmpty(description))
                {
                    setting.Description = description;
                }
                setting.UpdatedAt = DateTime.UtcNow;
                setting.UpdatedByAdminId = adminId;
            }

            await _context.SaveChangesAsync();

            // Invalidate cache
            _cache.Remove(CacheKeyPrefix + key);
        }

        public async Task<Dictionary<string, string>> GetAllSettingsAsync()
        {
            return await _context.SystemSettings
                .AsNoTracking()
                .ToDictionaryAsync(s => s.Key, s => s.Value);
        }
    }
}
