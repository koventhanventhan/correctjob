using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

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

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual ICollection<Company> Companies { get; set; } = new List<Company>();
        public virtual ICollection<SeekerProfile> SeekerProfiles { get; set; } = new List<SeekerProfile>();
        public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public virtual ICollection<Report> Reports { get; set; } = new List<Report>();
    }
}
