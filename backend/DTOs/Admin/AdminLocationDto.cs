using System.ComponentModel.DataAnnotations;

namespace HireConnect.API.DTOs.Admin
{
    public class AdminLocationListDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? StateOrProvince { get; set; }
        public string Country { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateLocationDto
    {
        [Required(ErrorMessage = "Location name is required.")]
        [MaxLength(100, ErrorMessage = "Location name cannot exceed 100 characters.")]
        public string Name { get; set; } = string.Empty;

        [MaxLength(100, ErrorMessage = "State/Province cannot exceed 100 characters.")]
        public string? StateOrProvince { get; set; }

        [MaxLength(100, ErrorMessage = "Country cannot exceed 100 characters.")]
        public string Country { get; set; } = "Sri Lanka";
    }

    public class UpdateLocationDto
    {
        [Required(ErrorMessage = "Location name is required.")]
        [MaxLength(100, ErrorMessage = "Location name cannot exceed 100 characters.")]
        public string Name { get; set; } = string.Empty;

        [MaxLength(100, ErrorMessage = "State/Province cannot exceed 100 characters.")]
        public string? StateOrProvince { get; set; }

        [MaxLength(100, ErrorMessage = "Country cannot exceed 100 characters.")]
        public string Country { get; set; } = "Sri Lanka";

        public bool IsActive { get; set; } = true;
    }
}
