using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HireConnect.API.Models
{
    public class JobInvitation
    {
        public int Id { get; set; }

        [Required]
        public string EmployerId { get; set; } = string.Empty;

        public int CompanyId { get; set; }

        public int JobId { get; set; }

        public int SeekerId { get; set; }

        [MaxLength(500)]
        public string? Message { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Pending"; // Pending, Accepted, Declined

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? RespondedAt { get; set; }

        [ForeignKey(nameof(EmployerId))]
        public virtual User Employer { get; set; } = null!;

        [ForeignKey(nameof(CompanyId))]
        public virtual Company Company { get; set; } = null!;

        [ForeignKey(nameof(JobId))]
        public virtual Job Job { get; set; } = null!;

        [ForeignKey(nameof(SeekerId))]
        public virtual SeekerProfile Seeker { get; set; } = null!;
    }
}
