using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HireConnect.API.Models
{
    public class Company
    {
        public int Id { get; set; }

        [Required]
        public string EmployerId { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string CompanyName { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? LogoUrl { get; set; }

        public string? Description { get; set; }

        [MaxLength(255)]
        public string? Website { get; set; }

        [MaxLength(100)]
        public string? Industry { get; set; }

        [MaxLength(50)]
        public string? CompanySize { get; set; }

        [MaxLength(100)]
        public string? Location { get; set; }

        public bool IsApproved { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(EmployerId))]
        public virtual User Employer { get; set; } = null!;

        public virtual ICollection<Job> Jobs { get; set; } = new List<Job>();
    }
}
