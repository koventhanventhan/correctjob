using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace HireConnect.API.Models
{
    public class User : IdentityUser
    {
        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? ProfileImage { get; set; }

        public bool IsActive { get; set; } = true;

        [MaxLength(500)]
        public string? BlockedReason { get; set; }

        public DateTime? LastLogin { get; set; }

        public bool MustChangePassword { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public override string? PasswordHash { get; set; }

        [JsonIgnore]
        public override string? SecurityStamp { get; set; }

        [JsonIgnore]
        public override string? ConcurrencyStamp { get; set; }

        [JsonIgnore]
        public override string? NormalizedEmail { get; set; }

        [JsonIgnore]
        public override string? NormalizedUserName { get; set; }

        [JsonIgnore]
        public override int AccessFailedCount { get; set; }

        [JsonIgnore]
        public override DateTimeOffset? LockoutEnd { get; set; }

        // Navigation properties
        [JsonIgnore]
        public virtual ICollection<Company> Companies { get; set; } = new List<Company>();
        [JsonIgnore]
        public virtual ICollection<SeekerProfile> SeekerProfiles { get; set; } = new List<SeekerProfile>();
        [JsonIgnore]
        public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        [JsonIgnore]
        public virtual ICollection<Report> Reports { get; set; } = new List<Report>();
    }
}
