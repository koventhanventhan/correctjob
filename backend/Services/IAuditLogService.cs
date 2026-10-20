namespace HireConnect.API.Services
{
    public interface IAuditLogService
    {
        Task LogAsync(string adminId, string action, string targetType, string? targetId = null, string? details = null, string? ipAddress = null);
    }
}
