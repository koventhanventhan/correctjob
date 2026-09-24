using System.ComponentModel.DataAnnotations;

namespace HireConnect.API.Models
{
    public class Category
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;

        public virtual ICollection<Job> Jobs { get; set; } = new List<Job>();
    }
}
