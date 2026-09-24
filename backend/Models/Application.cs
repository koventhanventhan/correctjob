using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HireConnect.API.Models
{
    public class Application
    {
        public int Id { get; set; }

        public int JobId { get; set; }
        
        public int SeekerId { get; set; }

        public string? CoverLetter { get; set; }

        [MaxLength(255)]
        public string? ResumeUrl { get; set; }

        [MaxLength(50)]
        public string Status { get; set; } = "Applied"; // Applied, UnderReview, Shortlisted, InterviewScheduled, Selected, Rejected

        public string? EmployerNotes { get; set; }

        public DateTime? InterviewDate { get; set; }

        public DateTime AppliedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(JobId))]
        public virtual Job Job { get; set; } = null!;

        [ForeignKey(nameof(SeekerId))]
        public virtual SeekerProfile Seeker { get; set; } = null!;
    }
}
