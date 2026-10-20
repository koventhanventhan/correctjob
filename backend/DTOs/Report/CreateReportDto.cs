using System.ComponentModel.DataAnnotations;

namespace HireConnect.API.DTOs.Report
{
    public class CreateReportDto
    {
        public int? JobId { get; set; }

        public int? ReviewId { get; set; }

        [Required(ErrorMessage = "Reason is required.")]
        [StringLength(500, MinimumLength = 3, ErrorMessage = "Reason must be between 3 and 500 characters.")]
        public string Reason { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters.")]
        public string? Description { get; set; }
    }
}
