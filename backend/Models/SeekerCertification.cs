using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace HireConnect.API.Models
{
    public class SeekerCertification
    {
        public int Id { get; set; }

        public int SeekerId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string IssuingOrganization { get; set; } = string.Empty;

        public DateTime? IssueDate { get; set; }

        public DateTime? ExpiryDate { get; set; }

        [MaxLength(300)]
        public string? CredentialUrl { get; set; }

        [ForeignKey(nameof(SeekerId))]
        [JsonIgnore]
        public virtual SeekerProfile? Seeker { get; set; }
    }
}
