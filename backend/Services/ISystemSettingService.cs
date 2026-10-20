namespace HireConnect.API.Services
{
    public interface ISystemSettingService
    {
        Task<decimal> GetJobPostingFeeAsync();
        Task<(bool Success, string? ErrorMessage)> SetJobPostingFeeAsync(decimal fee, string? adminId);
        Task<bool> IsMaintenanceModeAsync();
        Task SetMaintenanceModeAsync(bool enabled, string? adminId);
        Task<string> GetSettingAsync(string key, string defaultValue = "");
        Task SetSettingAsync(string key, string value, string? adminId = null, string? description = null);
        Task<Dictionary<string, string>> GetAllSettingsAsync();
    }
}
