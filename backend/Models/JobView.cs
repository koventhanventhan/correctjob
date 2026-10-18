using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HireConnect.API.Models
{
    public class JobView
    {
        public int Id { get; set; }

        public int JobId { get; set; }

        [MaxLength(450)]
        public string? UserId { get; set; }

        [Required]
        [MaxLength(64)]
        public string IpHash { get; set; } = string.Empty;

        public DateTime ViewedDate { get; set; } = DateTime.UtcNow.Date;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(JobId))]
        public virtual Job Job { get; set; } = null!;

        [ForeignKey(nameof(UserId))]
        public virtual User? User { get; set; }
    }
}
