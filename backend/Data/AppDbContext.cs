using HireConnect.API.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;

namespace HireConnect.API.Data
{
    public class AppDbContext : IdentityDbContext<User>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Company> Companies { get; set; }
        public DbSet<Job> Jobs { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Skill> Skills { get; set; }
        public DbSet<JobSkill> JobSkills { get; set; }
        public DbSet<SeekerProfile> SeekerProfiles { get; set; }
        public DbSet<Application> Applications { get; set; }
        public DbSet<SavedJob> SavedJobs { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Report> Reports { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder); // Important for Identity

            // JobSkill composite key
            builder.Entity<JobSkill>()
                .HasKey(js => new { js.JobId, js.SkillId });

            builder.Entity<JobSkill>()
                .HasOne(js => js.Job)
                .WithMany(j => j.JobSkills)
                .HasForeignKey(js => js.JobId);

            builder.Entity<JobSkill>()
                .HasOne(js => js.Skill)
                .WithMany(s => s.JobSkills)
                .HasForeignKey(js => js.SkillId);

            // Job -> Company relationship (Restrict delete so jobs aren't cascade deleted unexpectedly)
            builder.Entity<Job>()
                .HasOne(j => j.Company)
                .WithMany(c => c.Jobs)
                .HasForeignKey(j => j.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);

            // Application -> Job relationship
            builder.Entity<Application>()
                .HasOne(a => a.Job)
                .WithMany(j => j.Applications)
                .HasForeignKey(a => a.JobId)
                .OnDelete(DeleteBehavior.Restrict);

            // Application -> SeekerProfile relationship
            builder.Entity<Application>()
                .HasOne(a => a.Seeker)
                .WithMany(s => s.Applications)
                .HasForeignKey(a => a.SeekerId)
                .OnDelete(DeleteBehavior.Restrict);

            // SavedJob -> Job
            builder.Entity<SavedJob>()
                .HasOne(sj => sj.Job)
                .WithMany(j => j.SavedJobs)
                .HasForeignKey(sj => sj.JobId)
                .OnDelete(DeleteBehavior.Cascade);

            // SavedJob -> SeekerProfile
            builder.Entity<SavedJob>()
                .HasOne(sj => sj.Seeker)
                .WithMany(s => s.SavedJobs)
                .HasForeignKey(sj => sj.SeekerId)
                .OnDelete(DeleteBehavior.Restrict);
            
            // Notification -> User
            builder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Report -> User
            builder.Entity<Report>()
                .HasOne(r => r.User)
                .WithMany(u => u.Reports)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Report -> Job
            builder.Entity<Report>()
                .HasOne(r => r.Job)
                .WithMany()
                .HasForeignKey(r => r.JobId)
                .OnDelete(DeleteBehavior.SetNull);

            // Seed Data for Categories and Skills
            builder.Entity<Category>().HasData(
                new Category { Id = 1, Name = "Software Development", Description = "Programming and software engineering roles" },
                new Category { Id = 2, Name = "Marketing", Description = "Digital marketing, SEO, and content creation" },
                new Category { Id = 3, Name = "Finance", Description = "Accounting, financial analysis, and banking" },
                new Category { Id = 4, Name = "Healthcare", Description = "Medical, nursing, and healthcare administration" },
                new Category { Id = 5, Name = "Design", Description = "UI/UX, graphic design, and creative roles" }
            );

            builder.Entity<Skill>().HasData(
                new Skill { Id = 1, Name = "React" },
                new Skill { Id = 2, Name = "C#" },
                new Skill { Id = 3, Name = "SQL" },
                new Skill { Id = 4, Name = "JavaScript" },
                new Skill { Id = 5, Name = "TypeScript" },
                new Skill { Id = 6, Name = ".NET Core" }
            );
        }
    }
}
