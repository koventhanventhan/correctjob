using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HireConnect.API.Models
{
    public class ApplicationAnswer
    {
        public int Id { get; set; }

        public int ApplicationId { get; set; }

        public int QuestionId { get; set; }

        [Required]
        public string AnswerText { get; set; } = string.Empty;

        [ForeignKey(nameof(ApplicationId))]
        public virtual Application Application { get; set; } = null!;

        [ForeignKey(nameof(QuestionId))]
        public virtual JobScreeningQuestion Question { get; set; } = null!;
    }
}
