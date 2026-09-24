using System.ComponentModel.DataAnnotations;

namespace HireConnect.API.Models
{
    public class Skill
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;

        public virtual ICollection<JobSkill> JobSkills { get; set; } = new List<JobSkill>();
    }
}
