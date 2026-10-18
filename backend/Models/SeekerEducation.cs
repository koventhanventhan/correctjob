using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace HireConnect.API.Models
{
    public class SeekerEducation
    {
        public int Id { get; set; }

        public int SeekerId { get; set; }

        [Required]
        [MaxLength(150)]
        public string Institution { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string Degree { get; set; } = string.Empty;

        [MaxLength(150)]
        public string? FieldOfStudy { get; set; }

        public DateTime? StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        public bool IsCurrent { get; set; }

        [ForeignKey(nameof(SeekerId))]
        [JsonIgnore]
        public virtual SeekerProfile? Seeker { get; set; }
    }
}
