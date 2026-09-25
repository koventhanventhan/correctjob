using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HireConnect.API.Models
{
    public class Job
    {
        public int Id { get; set; }

        public int CompanyId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        public string? Requirements { get; set; }

        public string? Responsibilities { get; set; }

        [MaxLength(100)]
        public string? Location { get; set; }

        public decimal? SalaryMin { get; set; }
        public decimal? SalaryMax { get; set; }

        public int? ExperienceMin { get; set; }
        public int? ExperienceMax { get; set; }

        [MaxLength(50)]
        public string? JobType { get; set; } // Full-time, Part-time, Contract, etc.

        public int CategoryId { get; set; }

        public DateTime? Deadline { get; set; }

        [MaxLength(50)]
        public string Status { get; set; } = "Draft"; // Draft, PendingApproval, Approved, Published, Closed

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool IsPaid { get; set; } = false;

        [ForeignKey(nameof(CompanyId))]
        public virtual Company Company { get; set; } = null!;

        [ForeignKey(nameof(CategoryId))]
        public virtual Category Category { get; set; } = null!;

        public virtual ICollection<JobSkill> JobSkills { get; set; } = new List<JobSkill>();
        public virtual ICollection<Application> Applications { get; set; } = new List<Application>();
        public virtual ICollection<SavedJob> SavedJobs { get; set; } = new List<SavedJob>();
        public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }
}
