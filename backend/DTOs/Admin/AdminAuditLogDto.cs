namespace HireConnect.API.DTOs.Admin
{
    public class AdminAuditLogDto
    {
        public int Id { get; set; }
        public string AdminId { get; set; } = string.Empty;
        public string AdminName { get; set; } = string.Empty;
        public string? AdminEmail { get; set; }
        public string Action { get; set; } = string.Empty;
        public string? TargetType { get; set; }
        public string? TargetId { get; set; }
        public string? Details { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
