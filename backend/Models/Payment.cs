using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HireConnect.API.Models
{
    public class Payment
    {
        public int Id { get; set; }

        public int JobId { get; set; }

        [Required]
        public string EmployerId { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string OrderId { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        [MaxLength(10)]
        public string Currency { get; set; } = "LKR";

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending"; // Pending, Completed, Failed

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? CompletedAt { get; set; }

        [ForeignKey(nameof(JobId))]
        public virtual Job Job { get; set; } = null!;

        [ForeignKey(nameof(EmployerId))]
        public virtual User Employer { get; set; } = null!;
    }
}
