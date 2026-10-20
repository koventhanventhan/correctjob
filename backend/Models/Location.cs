using System.ComponentModel.DataAnnotations;

namespace HireConnect.API.Models
{
    public class Location
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? StateOrProvince { get; set; }

        [Required]
        [MaxLength(100)]
        public string Country { get; set; } = "Sri Lanka";

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
