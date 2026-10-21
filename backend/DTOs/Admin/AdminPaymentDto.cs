namespace HireConnect.API.DTOs.Admin
{
    public class AdminPaymentListDto
    {
        public int Id { get; set; }
        public string OrderId { get; set; } = string.Empty;
        public string Company { get; set; } = string.Empty;
        public string JobTitle { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }

    public class AdminReviewModerationDto
    {
        public string Action { get; set; } = string.Empty; // "Hide", "Unhide", "Delete"
        public string Reason { get; set; } = string.Empty;
    }
}
