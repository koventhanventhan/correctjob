using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HireConnect.API.Models
{
    public class AdminAuditLog
    {
        public int Id { get; set; }

        [Required]
        public string AdminId { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Action { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string TargetType { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? TargetId { get; set; }

        [MaxLength(1000)]
        public string? Details { get; set; }

        [MaxLength(128)]
        public string? IpHash { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(AdminId))]
        public virtual User Admin { get; set; } = null!;
    }
}
