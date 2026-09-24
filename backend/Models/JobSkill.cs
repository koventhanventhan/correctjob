using System.ComponentModel.DataAnnotations.Schema;

namespace HireConnect.API.Models
{
    public class JobSkill
    {
        public int JobId { get; set; }
        [ForeignKey(nameof(JobId))]
        public virtual Job Job { get; set; } = null!;

        public int SkillId { get; set; }
        [ForeignKey(nameof(SkillId))]
        public virtual Skill Skill { get; set; } = null!;
    }
}
