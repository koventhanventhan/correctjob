using System.ComponentModel.DataAnnotations;

namespace HireConnect.API.DTOs.Admin
{
    public class AdminSystemSettingsDto
    {
        public string SiteName { get; set; } = "HireConnect";
        public decimal JobPostingFee { get; set; } = 5000.00m;
        public string ContactEmail { get; set; } = "support@hireconnect.com";
        public bool MaintenanceMode { get; set; } = false;
        public DateTime? UpdatedAt { get; set; }
    }

    public class UpdateAdminSystemSettingsDto
    {
        [Required(ErrorMessage = "SiteName is required.")]
        [MaxLength(100, ErrorMessage = "SiteName cannot exceed 100 characters.")]
        public string SiteName { get; set; } = string.Empty;

        [Range(0, 1000000, ErrorMessage = "Job posting fee must be between 0 and 1,000,000 LKR.")]
        public decimal JobPostingFee { get; set; }

        [Required(ErrorMessage = "ContactEmail is required.")]
        [EmailAddress(ErrorMessage = "Invalid ContactEmail format.")]
        [MaxLength(200, ErrorMessage = "ContactEmail cannot exceed 200 characters.")]
        public string ContactEmail { get; set; } = string.Empty;

        public bool MaintenanceMode { get; set; }
    }

    public class PublicSettingsDto
    {
        public string SiteName { get; set; } = "HireConnect";
        public string ContactEmail { get; set; } = "support@hireconnect.com";
        public decimal JobPostingFee { get; set; } = 5000.00m;
        public bool MaintenanceMode { get; set; } = false;
    }
}
