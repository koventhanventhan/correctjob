using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HireConnect.API.Models
{
    public class JobScreeningQuestion
    {
        public int Id { get; set; }

        public int JobId { get; set; }

        [Required]
        [MaxLength(500)]
        public string QuestionText { get; set; } = string.Empty;

        [MaxLength(50)]
        public string QuestionType { get; set; } = "Text"; // Text, YesNo, Number, Choice

        public bool IsRequired { get; set; } = true;

        [MaxLength(200)]
        public string? IdealAnswer { get; set; }

        public int OrderIndex { get; set; } = 0;

        [ForeignKey(nameof(JobId))]
        public virtual Job Job { get; set; } = null!;

        public virtual ICollection<ApplicationAnswer> Answers { get; set; } = new List<ApplicationAnswer>();
    }
}
