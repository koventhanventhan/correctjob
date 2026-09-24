using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HireConnect.API.Models
{
    public class JobAlert
    {
        public int Id { get; set; }

        [Required]
        public string SeekerId { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? Keyword { get; set; }

        [MaxLength(100)]
        public string? Location { get; set; }

        public int? CategoryId { get; set; }

        [MaxLength(50)]
        public string? JobType { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastCheckedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(SeekerId))]
        public virtual User Seeker { get; set; } = null!;

        [ForeignKey(nameof(CategoryId))]
        public virtual Category? Category { get; set; }
    }
}
