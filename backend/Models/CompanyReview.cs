using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace HireConnect.API.Models
{
    [Index(nameof(CompanyId), nameof(SeekerId), IsUnique = true)]
    public class CompanyReview
    {
        public int Id { get; set; }

        public int CompanyId { get; set; }

        [Required]
        [MaxLength(450)] // Match AspNetUsers.Id length
        public string SeekerId { get; set; } = string.Empty;

        [Range(1, 5)]
        public int Rating { get; set; }

        [Required]
        [MaxLength(200)]
        public string Headline { get; set; } = string.Empty;

        [Required]
        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        public bool IsHidden { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(CompanyId))]
        public virtual Company Company { get; set; } = null!;

        [ForeignKey(nameof(SeekerId))]
        public virtual User Seeker { get; set; } = null!;
    }
}
