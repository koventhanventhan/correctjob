using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HireConnect.API.Models
{
    public class SavedJob
    {
        public int Id { get; set; }

        public int JobId { get; set; }

        public int SeekerId { get; set; }

        public DateTime SavedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(JobId))]
        public virtual Job Job { get; set; } = null!;

        [ForeignKey(nameof(SeekerId))]
        public virtual SeekerProfile Seeker { get; set; } = null!;
    }
}
