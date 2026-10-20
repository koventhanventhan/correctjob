using HireConnect.API.Data;
using HireConnect.API.Models;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace HireConnect.API.Services
{
    public class AuditLogService : IAuditLogService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly ILogger<AuditLogService> _logger;

        // Matches JSON or key-value fields containing password, token, secret, api key, etc.
        private static readonly Regex SensitivePatternsRegex = new(
            @"(?i)(""(?:password|pwd|currentpassword|newpassword|token|refreshtoken|accesstoken|secret|clientsecret|apikey|authorization|cvv|creditcard)""\s*:\s*)"".*?""|((?:password|token|secret|apikey)\s*=\s*)[^\s,;&]+",
            RegexOptions.Compiled
        );

        // General Bearer token regex
        private static readonly Regex BearerTokenRegex = new(
            @"(?i)bearer\s+[a-z0-9\-_.]+",
            RegexOptions.Compiled
        );

        public AuditLogService(AppDbContext context, IConfiguration config, ILogger<AuditLogService> logger)
        {
            _context = context;
            _config = config;
            _logger = logger;
        }

        public async Task LogAsync(
            string adminId,
            string action,
            string targetType,
            string? targetId = null,
            string? details = null,
            string? ipAddress = null)
        {
            try
            {
                var sanitizedDetails = SanitizeDetails(details);
                var ipHash = ComputeIpHash(ipAddress);

                var auditLog = new AdminAuditLog
                {
                    AdminId = adminId,
                    Action = Truncate(action, 100),
                    TargetType = Truncate(targetType, 50),
                    TargetId = Truncate(targetId, 100),
                    Details = sanitizedDetails,
                    IpHash = ipHash,
                    CreatedAt = DateTime.UtcNow
                };

                _context.AdminAuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Never let audit logging failure crash critical flows, but log error prominently
                _logger.LogError(ex, "Failed to record AdminAuditLog for action '{Action}' by admin '{AdminId}'.", action, adminId);
            }
        }

        public static string? SanitizeDetails(string? details)
        {
            if (string.IsNullOrWhiteSpace(details)) return null;

            var result = details;

            // Redact JSON/key-value sensitive entries
            result = SensitivePatternsRegex.Replace(result, m =>
            {
                if (m.Groups[1].Success)
                {
                    return $"{m.Groups[1].Value}\"[REDACTED]\"";
                }
                if (m.Groups[2].Success)
                {
                    return $"{m.Groups[2].Value}[REDACTED]";
                }
                return "[REDACTED]";
            });

            // Redact Bearer tokens
            result = BearerTokenRegex.Replace(result, "Bearer [REDACTED]");

            // Hard clamp to 1000 characters maximum
            if (result.Length > 1000)
            {
                result = result.Substring(0, 997) + "...";
            }

            return result;
        }

        private string? ComputeIpHash(string? ipAddress)
        {
            if (string.IsNullOrWhiteSpace(ipAddress)) return null;

            var salt = _config["Security:IpHashSalt"];
            if (string.IsNullOrWhiteSpace(salt))
            {
                _logger.LogWarning("Security:IpHashSalt is not configured. Falling back to default empty salt for hash.");
                salt = "DEFAULT_CORRECTJOB_HASH_SALT";
            }

            using var sha256 = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(ipAddress.Trim() + ":" + salt);
            var hash = sha256.ComputeHash(bytes);
            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        private static string Truncate(string? value, int maxLength)
        {
            if (string.IsNullOrEmpty(value)) return string.Empty;
            return value.Length <= maxLength ? value : value.Substring(0, maxLength);
        }
    }
}
