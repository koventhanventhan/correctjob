using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace HireConnect.API.Models
{
    public class SeekerSkill
    {
        public int Id { get; set; }

        public int SeekerId { get; set; }

        [Required]
        [MaxLength(100)]
        public string SkillName { get; set; } = string.Empty;

        public int? YearsExperience { get; set; }

        [ForeignKey(nameof(SeekerId))]
        [JsonIgnore]
        public virtual SeekerProfile? Seeker { get; set; }
    }
}
