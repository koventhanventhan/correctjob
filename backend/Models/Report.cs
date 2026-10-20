using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HireConnect.API.Models
{
    public class Report
    {
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        public int? JobId { get; set; }

        public int? ReviewId { get; set; }

        [Required]
        [MaxLength(500)]
        public string Reason { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [MaxLength(50)]
        public string Status { get; set; } = "Pending"; // Pending, Reviewed, Resolved, Dismissed

        [MaxLength(1000)]
        public string? AdminNote { get; set; }

        public DateTime? ResolvedAt { get; set; }

        public string? ResolvedByAdminId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; } = null!;

        [ForeignKey(nameof(JobId))]
        public virtual Job? Job { get; set; }

        [ForeignKey(nameof(ReviewId))]
        public virtual CompanyReview? Review { get; set; }

        [ForeignKey(nameof(ResolvedByAdminId))]
        public virtual User? ResolvedByAdmin { get; set; }
    }
}
