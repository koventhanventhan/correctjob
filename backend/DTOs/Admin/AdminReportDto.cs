namespace HireConnect.API.DTOs.Admin
{
    public class AdminReportListDto
    {
        public int Id { get; set; }
        public string ReporterName { get; set; } = string.Empty;
        public string ReportType { get; set; } = string.Empty; // "Job" or "Review"
        public string TargetSummary { get; set; } = string.Empty; // Job title or review excerpt
        public int? TargetId { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? AdminNote { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
    }

    public class UpdateReportStatusDto
    {
        public string Status { get; set; } = string.Empty;
        public string? AdminNote { get; set; }
    }

    public class AdminReportActionDto
    {
        public string Action { get; set; } = string.Empty; // "CloseJob", "HideReview", "DeleteReview"
        public string? Reason { get; set; }
    }
}
