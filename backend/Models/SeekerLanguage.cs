using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace HireConnect.API.Models
{
    public class SeekerLanguage
    {
        public int Id { get; set; }

        public int SeekerId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Language { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Proficiency { get; set; } = "Conversational"; // Basic, Conversational, Fluent, Native

        [ForeignKey(nameof(SeekerId))]
        [JsonIgnore]
        public virtual SeekerProfile? Seeker { get; set; }
    }
}
