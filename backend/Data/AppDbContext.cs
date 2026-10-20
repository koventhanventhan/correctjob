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
        public DbSet<JobAlert> JobAlerts { get; set; }
        public DbSet<Report> Reports { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<CompanyReview> CompanyReviews { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<JobScreeningQuestion> JobScreeningQuestions { get; set; }
        public DbSet<ApplicationAnswer> ApplicationAnswers { get; set; }
        public DbSet<SeekerResume> SeekerResumes { get; set; }
        public DbSet<SeekerWorkHistory> SeekerWorkHistories { get; set; }
        public DbSet<SeekerEducation> SeekerEducations { get; set; }
        public DbSet<SeekerSkill> SeekerSkills { get; set; }
        public DbSet<SeekerLanguage> SeekerLanguages { get; set; }
        public DbSet<SeekerCertification> SeekerCertifications { get; set; }
        public DbSet<JobView> JobViews { get; set; }
        public DbSet<JobInvitation> Invitations { get; set; }
        public DbSet<AdminAuditLog> AdminAuditLogs { get; set; }
        public DbSet<Location> Locations { get; set; }
        public DbSet<SystemSetting> SystemSettings { get; set; }

        private void EnforceAuditLogImmutability()
        {
            var modifiedAuditLogs = ChangeTracker.Entries<AdminAuditLog>()
                .Where(e => e.State == EntityState.Modified || e.State == EntityState.Deleted)
                .ToList();

            if (modifiedAuditLogs.Count > 0)
            {
                throw new InvalidOperationException("AdminAuditLogs records are immutable and cannot be modified or deleted.");
            }
        }

        public override int SaveChanges()
        {
            EnforceAuditLogImmutability();
            return base.SaveChanges();
        }

        public override int SaveChanges(bool acceptAllChangesOnSuccess)
        {
            EnforceAuditLogImmutability();
            return base.SaveChanges(acceptAllChangesOnSuccess);
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            EnforceAuditLogImmutability();
            return base.SaveChangesAsync(cancellationToken);
        }

        public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
        {
            EnforceAuditLogImmutability();
            return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
        }

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

            // Unique index to prevent duplicate applications
            builder.Entity<Application>()
                .HasIndex(a => new { a.JobId, a.SeekerId })
                .IsUnique();

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

            // Report -> Review
            builder.Entity<Report>()
                .HasOne(r => r.Review)
                .WithMany()
                .HasForeignKey(r => r.ReviewId)
                .OnDelete(DeleteBehavior.SetNull);

            // Report -> ResolvedByAdmin
            builder.Entity<Report>()
                .HasOne(r => r.ResolvedByAdmin)
                .WithMany()
                .HasForeignKey(r => r.ResolvedByAdminId)
                .OnDelete(DeleteBehavior.SetNull);

            // Report indexes for queries & duplicate checks
            builder.Entity<Report>()
                .HasIndex(r => r.UserId);

            builder.Entity<Report>()
                .HasIndex(r => new { r.UserId, r.JobId });

            builder.Entity<Report>()
                .HasIndex(r => new { r.UserId, r.ReviewId });

            builder.Entity<Report>()
                .HasIndex(r => new { r.UserId, r.CreatedAt });

            // CompanyReview -> Company
            builder.Entity<CompanyReview>()
                .HasOne(cr => cr.Company)
                .WithMany(c => c.Reviews)
                .HasForeignKey(cr => cr.CompanyId)
                .OnDelete(DeleteBehavior.Cascade);

            // CompanyReview -> SeekerProfile / User
            builder.Entity<CompanyReview>()
                .HasOne(cr => cr.Seeker)
                .WithMany()
                .HasForeignKey(cr => cr.SeekerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Payment -> Job
            builder.Entity<Payment>()
                .HasOne(p => p.Job)
                .WithMany(j => j.Payments)
                .HasForeignKey(p => p.JobId)
                .OnDelete(DeleteBehavior.Cascade);

            // Payment -> Employer (User)
            builder.Entity<Payment>()
                .HasOne(p => p.Employer)
                .WithMany()
                .HasForeignKey(p => p.EmployerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Message -> Application
            builder.Entity<Message>()
                .HasOne(m => m.Application)
                .WithMany()
                .HasForeignKey(m => m.ApplicationId)
                .OnDelete(DeleteBehavior.Cascade);

            // Message -> User (Sender)
            builder.Entity<Message>()
                .HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            // JobScreeningQuestion -> Job
            builder.Entity<JobScreeningQuestion>()
                .HasOne(q => q.Job)
                .WithMany(j => j.ScreeningQuestions)
                .HasForeignKey(q => q.JobId)
                .OnDelete(DeleteBehavior.Cascade);

            // ApplicationAnswer -> Application
            builder.Entity<ApplicationAnswer>()
                .HasOne(a => a.Application)
                .WithMany(app => app.Answers)
                .HasForeignKey(a => a.ApplicationId)
                .OnDelete(DeleteBehavior.Cascade);

            // ApplicationAnswer -> JobScreeningQuestion
            builder.Entity<ApplicationAnswer>()
                .HasOne(a => a.Question)
                .WithMany(q => q.Answers)
                .HasForeignKey(a => a.QuestionId)
                .OnDelete(DeleteBehavior.Restrict);

            // SeekerResume -> SeekerProfile
            builder.Entity<SeekerResume>()
                .HasOne(r => r.Seeker)
                .WithMany(s => s.Resumes)
                .HasForeignKey(r => r.SeekerId)
                .OnDelete(DeleteBehavior.Cascade);

            // JobView -> Job & User
            builder.Entity<JobView>()
                .HasOne(v => v.Job)
                .WithMany(j => j.Views)
                .HasForeignKey(v => v.JobId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<JobView>()
                .HasOne(v => v.User)
                .WithMany()
                .HasForeignKey(v => v.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.Entity<JobView>()
                .HasIndex(v => new { v.JobId, v.ViewedDate, v.UserId })
                .IsUnique();

            builder.Entity<JobView>()
                .HasIndex(v => new { v.JobId, v.ViewedDate, v.IpHash })
                .IsUnique();

            // JobInvitation relationships
            builder.Entity<JobInvitation>()
                .HasOne(i => i.Job)
                .WithMany()
                .HasForeignKey(i => i.JobId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<JobInvitation>()
                .HasOne(i => i.Seeker)
                .WithMany()
                .HasForeignKey(i => i.SeekerId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<JobInvitation>()
                .HasOne(i => i.Company)
                .WithMany()
                .HasForeignKey(i => i.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<JobInvitation>()
                .HasOne(i => i.Employer)
                .WithMany()
                .HasForeignKey(i => i.EmployerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Unique index: same seeker + same job = only 1 invitation!
            builder.Entity<JobInvitation>()
                .HasIndex(i => new { i.JobId, i.SeekerId })
                .IsUnique();

            // Index for daily invitation rate limiting check
            builder.Entity<JobInvitation>()
                .HasIndex(i => new { i.EmployerId, i.CreatedAt });

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

            // AdminAuditLog configuration
            builder.Entity<AdminAuditLog>()
                .HasOne(a => a.Admin)
                .WithMany()
                .HasForeignKey(a => a.AdminId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<AdminAuditLog>()
                .HasIndex(a => a.CreatedAt);

            builder.Entity<AdminAuditLog>()
                .HasIndex(a => new { a.Action, a.CreatedAt });

            builder.Entity<AdminAuditLog>()
                .HasIndex(a => new { a.AdminId, a.CreatedAt });

            // Location configuration
            builder.Entity<Location>()
                .HasIndex(l => l.Name)
                .IsUnique();

            // SystemSetting configuration
            builder.Entity<SystemSetting>()
                .HasIndex(s => s.Key)
                .IsUnique();

            builder.Entity<SystemSetting>()
                .HasOne(s => s.UpdatedByAdmin)
                .WithMany()
                .HasForeignKey(s => s.UpdatedByAdminId)
                .OnDelete(DeleteBehavior.SetNull);

            // Seed Data for SystemSettings
            builder.Entity<SystemSetting>().HasData(
                new SystemSetting { Id = 1, Key = "JobPostingFee", Value = "5000.00", Description = "Fee charged for posting a job in LKR", UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new SystemSetting { Id = 2, Key = "MaintenanceMode", Value = "false", Description = "Platform maintenance mode toggle (true/false)", UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new SystemSetting { Id = 3, Key = "PlatformName", Value = "HireConnect", Description = "Platform public display name", UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new SystemSetting { Id = 4, Key = "ContactEmail", Value = "support@hireconnect.com", Description = "Platform support contact email", UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
            );

            // Seed Data for Locations (Sri Lanka)
            builder.Entity<Location>().HasData(
                new Location { Id = 1, Name = "Colombo", StateOrProvince = "Western", Country = "Sri Lanka", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Location { Id = 2, Name = "Kandy", StateOrProvince = "Central", Country = "Sri Lanka", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Location { Id = 3, Name = "Galle", StateOrProvince = "Southern", Country = "Sri Lanka", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Location { Id = 4, Name = "Jaffna", StateOrProvince = "Northern", Country = "Sri Lanka", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Location { Id = 5, Name = "Gampaha", StateOrProvince = "Western", Country = "Sri Lanka", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Location { Id = 6, Name = "Negombo", StateOrProvince = "Western", Country = "Sri Lanka", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Location { Id = 7, Name = "Kurunegala", StateOrProvince = "North Western", Country = "Sri Lanka", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Location { Id = 8, Name = "Batticaloa", StateOrProvince = "Eastern", Country = "Sri Lanka", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Location { Id = 9, Name = "Matara", StateOrProvince = "Southern", Country = "Sri Lanka", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Location { Id = 10, Name = "Anuradhapura", StateOrProvince = "North Central", Country = "Sri Lanka", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
            );
        }
    }
}
