using HireConnect.API.Data;
using HireConnect.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HireConnect.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "JobSeeker")]
    public class SeekerProfilesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly HireConnect.API.Services.IFileStorageService _fileStorage;
        private readonly HireConnect.API.Services.IResumeExtractorService _extractor;

        public SeekerProfilesController(AppDbContext context, HireConnect.API.Services.IFileStorageService fileStorage, HireConnect.API.Services.IResumeExtractorService extractor)
        {
            _context = context;
            _fileStorage = fileStorage;
            _extractor = extractor;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var profile = await _context.SeekerProfiles
                .Include(s => s.WorkHistories)
                .Include(s => s.Educations)
                .Include(s => s.Skills)
                .Include(s => s.Languages)
                .Include(s => s.Certifications)
                .Include(s => s.Resumes)
                .FirstOrDefaultAsync(s => s.UserId == userId);
            
            if (profile == null)
            {
                // Return an empty profile if not yet created, or 404
                return Ok(new { });
            }

            return Ok(new
            {
                profile.Id,
                profile.UserId,
                profile.CareerTitle,
                profile.Bio,
                profile.Experience,
                profile.Education,
                profile.Location,
                profile.ResumeUrl,
                profile.ResumeText,
                profile.LinkedInUrl,
                profile.PortfolioUrl,
                profile.VerificationStatus,
                profile.VerificationNotes,
                profile.VerifiedAt,
                profile.IsOpenToWork,
                WorkHistories = profile.WorkHistories.Select(w => new { w.Id, w.JobTitle, w.Company, w.Location, w.StartDate, w.EndDate, w.IsCurrent, w.Description }),
                Educations = profile.Educations.Select(e => new { e.Id, e.Degree, e.Institution, e.FieldOfStudy, e.StartDate, e.EndDate, e.IsCurrent }),
                Skills = profile.Skills.Select(s => new { s.Id, s.SkillName, s.YearsExperience }),
                Languages = profile.Languages.Select(l => new { l.Id, l.Language, l.Proficiency }),
                Certifications = profile.Certifications.Select(c => new { c.Id, c.Name, c.IssuingOrganization, c.IssueDate, c.ExpiryDate, c.CredentialUrl }),
                Resumes = profile.Resumes.Select(r => new { r.Id, r.Title, r.FileUrl, r.FileName, r.IsDefault, r.UploadedAt })
            });
        }

        [HttpPut("me")]
        public async Task<IActionResult> UpdateProfile([FromBody] SeekerProfileDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var existing = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);

            if (existing == null)
            {
                // Create
                existing = new SeekerProfile { UserId = userId! };
                _context.SeekerProfiles.Add(existing);
            }

            existing.CareerTitle = model.CareerTitle;
            existing.Bio = model.Bio;
            existing.Experience = model.Experience;
            existing.Education = model.Education;
            existing.Location = model.Location;
            existing.LinkedInUrl = model.LinkedInUrl;
            existing.PortfolioUrl = model.PortfolioUrl;
            if (model.IsOpenToWork.HasValue)
            {
                existing.IsOpenToWork = model.IsOpenToWork.Value;
            }

            await _context.SaveChangesAsync();
            return Ok(new
            {
                existing.Id,
                existing.UserId,
                existing.CareerTitle,
                existing.Bio,
                existing.Experience,
                existing.Education,
                existing.Location,
                existing.LinkedInUrl,
                existing.PortfolioUrl,
                existing.IsOpenToWork,
                existing.VerificationStatus
            });
        }
        
        [HttpPost("resume")]
        [RequestSizeLimit(5242880)] // 5 MB limit
        public async Task<IActionResult> UploadResume(IFormFile resumeFile)
        {
            if (resumeFile == null || resumeFile.Length == 0) return BadRequest("No file uploaded.");

            // 1. Validate file size (max 5 MB)
            const long maxFileSize = 5 * 1024 * 1024;
            if (resumeFile.Length > maxFileSize)
            {
                return BadRequest("File size exceeds the 5 MB limit.");
            }

            // 2. Validate file type
            var allowedContentTypes = new[]
            {
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            };

            if (!allowedContentTypes.Contains(resumeFile.ContentType))
            {
                return BadRequest("Invalid file type. Only PDF and Word documents are allowed.");
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var profile = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (profile == null)
            {
                profile = new SeekerProfile { UserId = userId! };
                _context.SeekerProfiles.Add(profile);
            }

            var resumeUrl = await _fileStorage.UploadFileAsync(resumeFile, "resumes");
            profile.ResumeUrl = resumeUrl;
            
            try
            {
                using var stream = resumeFile.OpenReadStream();
                var text = await _extractor.ExtractTextAsync(stream, resumeFile.ContentType);
                profile.ResumeText = text;
            }
            catch
            {
                profile.ResumeText = null;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Resume uploaded successfully", resumeUrl });
        }

        [HttpGet("download-resume")]
        public async Task<IActionResult> DownloadResume()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var profile = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);

            if (profile == null || string.IsNullOrEmpty(profile.ResumeUrl)) return NotFound();

            var filePath = _fileStorage.GetPhysicalFilePath(profile.ResumeUrl, "resumes");
            if (string.IsNullOrEmpty(filePath) || !System.IO.File.Exists(filePath)) return NotFound();

            var provider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(filePath, out var contentType))
            {
                contentType = "application/octet-stream";
            }

            return PhysicalFile(filePath, contentType, Path.GetFileName(filePath));
        }

        [HttpPost("verify-identity")]
        [RequestSizeLimit(10485760)] // 10 MB total
        public async Task<IActionResult> UploadIdCard(IFormFile front, IFormFile? back)
        {
            if (front == null || front.Length == 0) return BadRequest("Front ID card is required.");

            const long maxFileSize = 5 * 1024 * 1024;
            var allowedContentTypes = new[] { "image/jpeg", "image/png", "application/pdf" };

            if (front.Length > maxFileSize) return BadRequest("Front ID card exceeds 5MB.");
            if (!allowedContentTypes.Contains(front.ContentType)) return BadRequest("Invalid file type for front ID.");

            if (back != null)
            {
                if (back.Length > maxFileSize) return BadRequest("Back ID card exceeds 5MB.");
                if (!allowedContentTypes.Contains(back.ContentType)) return BadRequest("Invalid file type for back ID.");
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var profile = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (profile == null)
            {
                profile = new SeekerProfile { UserId = userId! };
                _context.SeekerProfiles.Add(profile);
            }

            profile.IdCardFrontUrl = await _fileStorage.UploadFileAsync(front, "id-cards");

            if (back != null)
            {
                profile.IdCardBackUrl = await _fileStorage.UploadFileAsync(back, "id-cards");
            }

            profile.VerificationStatus = "Pending";
            profile.VerificationNotes = null;

            await _context.SaveChangesAsync();
            return Ok(new { message = "ID card uploaded successfully", status = profile.VerificationStatus });
        }

        [HttpGet("id-card/{side}")]
        [AllowAnonymous] // We handle custom auth inside
        public async Task<IActionResult> DownloadIdCard(string side, [FromQuery] int? profileId = null)
        {
            if (!User.Identity?.IsAuthenticated ?? true) return Unauthorized();

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");

            SeekerProfile? profile;

            if (isAdmin && profileId.HasValue)
            {
                profile = await _context.SeekerProfiles.FindAsync(profileId.Value);
            }
            else
            {
                profile = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            }

            if (profile == null) return NotFound();

            if (!isAdmin && profile.UserId != userId) return Forbid();

            var fileUrl = side.ToLower() == "back" ? profile.IdCardBackUrl : profile.IdCardFrontUrl;
            if (string.IsNullOrEmpty(fileUrl)) return NotFound();

            var filePath = _fileStorage.GetPhysicalFilePath(fileUrl, "id-cards");
            if (string.IsNullOrEmpty(filePath) || !System.IO.File.Exists(filePath)) return NotFound();

            var provider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(filePath, out var contentType))
            {
                contentType = "application/octet-stream";
            }

            return PhysicalFile(filePath, contentType, Path.GetFileName(filePath));
        }

        [HttpGet("resumes")]
        public async Task<IActionResult> GetMyResumes()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var seeker = await _context.SeekerProfiles
                .Include(s => s.Resumes)
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (seeker == null) return Ok(new List<object>());

            var resumes = seeker.Resumes
                .OrderByDescending(r => r.IsDefault)
                .ThenByDescending(r => r.UploadedAt)
                .Select(r => new
                {
                    r.Id,
                    r.Title,
                    r.FileUrl,
                    r.FileName,
                    r.IsDefault,
                    r.UploadedAt
                })
                .ToList();

            return Ok(resumes);
        }

        [HttpPost("resumes")]
        [RequestSizeLimit(5242880)] // 5 MB
        public async Task<IActionResult> AddResume([FromForm] AddResumeDto model)
        {
            if (model.File == null || model.File.Length == 0) return BadRequest("File is required.");
            if (model.File.Length > 5 * 1024 * 1024) return BadRequest("File size cannot exceed 5MB.");

            var ext = Path.GetExtension(model.File.FileName)?.ToLowerInvariant();
            var allowedExts = new[] { ".pdf", ".doc", ".docx" };
            if (!allowedExts.Contains(ext)) return BadRequest("Only PDF and Word documents are supported.");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var seeker = await _context.SeekerProfiles.Include(s => s.Resumes).FirstOrDefaultAsync(s => s.UserId == userId);
            if (seeker == null)
            {
                seeker = new SeekerProfile { UserId = userId! };
                _context.SeekerProfiles.Add(seeker);
                await _context.SaveChangesAsync();
            }

            var fileUrl = await _fileStorage.UploadFileAsync(model.File, "resumes");
            string? extractedText = null;
            try
            {
                using var stream = model.File.OpenReadStream();
                extractedText = await _extractor.ExtractTextAsync(stream, model.File.ContentType);
            }
            catch { }

            bool isDefault = model.IsDefault || seeker.Resumes.Count == 0;
            if (isDefault)
            {
                foreach (var r in seeker.Resumes) r.IsDefault = false;
                seeker.ResumeUrl = fileUrl;
                seeker.ResumeText = extractedText;
            }

            var resume = new SeekerResume
            {
                SeekerId = seeker.Id,
                Title = !string.IsNullOrWhiteSpace(model.Title) ? model.Title.Trim() : model.File.FileName,
                FileName = model.File.FileName,
                FileUrl = fileUrl,
                ResumeText = extractedText,
                IsDefault = isDefault,
                UploadedAt = DateTime.UtcNow
            };

            _context.SeekerResumes.Add(resume);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                resume.Id,
                resume.Title,
                resume.FileUrl,
                resume.FileName,
                resume.IsDefault,
                resume.UploadedAt
            });
        }

        [HttpDelete("resumes/{id}")]
        public async Task<IActionResult> DeleteResume(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var seeker = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (seeker == null) return NotFound();

            var resume = await _context.SeekerResumes.FirstOrDefaultAsync(r => r.Id == id && r.SeekerId == seeker.Id);
            if (resume == null) return NotFound();

            await _fileStorage.DeleteFileAsync(resume.FileUrl);
            _context.SeekerResumes.Remove(resume);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Resume deleted successfully." });
        }

        [HttpPut("resumes/{id}/default")]
        public async Task<IActionResult> SetDefaultResume(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var seeker = await _context.SeekerProfiles
                .Include(s => s.Resumes)
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (seeker == null) return NotFound();

            var resume = seeker.Resumes.FirstOrDefault(r => r.Id == id);
            if (resume == null) return NotFound();

            foreach (var r in seeker.Resumes)
            {
                r.IsDefault = (r.Id == id);
            }

            seeker.ResumeUrl = resume.FileUrl;
            seeker.ResumeText = resume.ResumeText;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Default resume updated." });
        }

        [HttpPatch("open-to-work")]
        public async Task<IActionResult> ToggleOpenToWork([FromBody] ToggleOpenToWorkDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var profile = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (profile == null)
            {
                profile = new SeekerProfile { UserId = userId!, IsOpenToWork = model.IsOpenToWork };
                _context.SeekerProfiles.Add(profile);
            }
            else
            {
                profile.IsOpenToWork = model.IsOpenToWork;
            }
            await _context.SaveChangesAsync();
            return Ok(new { isOpenToWork = profile.IsOpenToWork });
        }

        // --- Work History Endpoints ---
        [HttpPost("work-history")]
        public async Task<IActionResult> AddWorkHistory([FromBody] WorkHistoryDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var profile = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (profile == null) return NotFound("Profile not found.");

            var item = new SeekerWorkHistory
            {
                SeekerId = profile.Id,
                JobTitle = model.JobTitle,
                Company = model.Company,
                Location = model.Location,
                StartDate = model.StartDate,
                EndDate = model.EndDate,
                IsCurrent = model.IsCurrent,
                Description = model.Description
            };

            _context.SeekerWorkHistories.Add(item);
            await _context.SaveChangesAsync();
            return Ok(item);
        }

        [HttpPut("work-history/{id}")]
        public async Task<IActionResult> UpdateWorkHistory(int id, [FromBody] WorkHistoryDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var item = await _context.SeekerWorkHistories
                .Include(w => w.Seeker)
                .FirstOrDefaultAsync(w => w.Id == id && w.Seeker!.UserId == userId);
            if (item == null) return NotFound();

            item.JobTitle = model.JobTitle;
            item.Company = model.Company;
            item.Location = model.Location;
            item.StartDate = model.StartDate;
            item.EndDate = model.EndDate;
            item.IsCurrent = model.IsCurrent;
            item.Description = model.Description;

            await _context.SaveChangesAsync();
            return Ok(item);
        }

        [HttpDelete("work-history/{id}")]
        public async Task<IActionResult> DeleteWorkHistory(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var item = await _context.SeekerWorkHistories
                .Include(w => w.Seeker)
                .FirstOrDefaultAsync(w => w.Id == id && w.Seeker!.UserId == userId);
            if (item == null) return NotFound();

            _context.SeekerWorkHistories.Remove(item);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Work history deleted." });
        }

        // --- Education Endpoints ---
        [HttpPost("education")]
        public async Task<IActionResult> AddEducation([FromBody] EducationDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var profile = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (profile == null) return NotFound("Profile not found.");

            var item = new SeekerEducation
            {
                SeekerId = profile.Id,
                Institution = model.Institution,
                Degree = model.Degree,
                FieldOfStudy = model.FieldOfStudy,
                StartDate = model.StartDate,
                EndDate = model.EndDate,
                IsCurrent = model.IsCurrent
            };

            _context.SeekerEducations.Add(item);
            await _context.SaveChangesAsync();
            return Ok(item);
        }

        [HttpPut("education/{id}")]
        public async Task<IActionResult> UpdateEducation(int id, [FromBody] EducationDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var item = await _context.SeekerEducations
                .Include(e => e.Seeker)
                .FirstOrDefaultAsync(e => e.Id == id && e.Seeker!.UserId == userId);
            if (item == null) return NotFound();

            item.Institution = model.Institution;
            item.Degree = model.Degree;
            item.FieldOfStudy = model.FieldOfStudy;
            item.StartDate = model.StartDate;
            item.EndDate = model.EndDate;
            item.IsCurrent = model.IsCurrent;

            await _context.SaveChangesAsync();
            return Ok(item);
        }

        [HttpDelete("education/{id}")]
        public async Task<IActionResult> DeleteEducation(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var item = await _context.SeekerEducations
                .Include(e => e.Seeker)
                .FirstOrDefaultAsync(e => e.Id == id && e.Seeker!.UserId == userId);
            if (item == null) return NotFound();

            _context.SeekerEducations.Remove(item);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Education deleted." });
        }

        // --- Skills Endpoints ---
        [HttpPost("skills")]
        public async Task<IActionResult> AddSkill([FromBody] SkillDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var profile = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (profile == null) return NotFound("Profile not found.");

            var item = new SeekerSkill
            {
                SeekerId = profile.Id,
                SkillName = model.SkillName.Trim(),
                YearsExperience = model.YearsExperience
            };

            _context.SeekerSkills.Add(item);
            await _context.SaveChangesAsync();
            return Ok(item);
        }

        [HttpDelete("skills/{id}")]
        public async Task<IActionResult> DeleteSkill(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var item = await _context.SeekerSkills
                .Include(s => s.Seeker)
                .FirstOrDefaultAsync(s => s.Id == id && s.Seeker!.UserId == userId);
            if (item == null) return NotFound();

            _context.SeekerSkills.Remove(item);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Skill deleted." });
        }

        // --- Languages Endpoints ---
        [HttpPost("languages")]
        public async Task<IActionResult> AddLanguage([FromBody] LanguageDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var profile = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (profile == null) return NotFound("Profile not found.");

            var item = new SeekerLanguage
            {
                SeekerId = profile.Id,
                Language = model.Language.Trim(),
                Proficiency = string.IsNullOrWhiteSpace(model.Proficiency) ? "Conversational" : model.Proficiency.Trim()
            };

            _context.SeekerLanguages.Add(item);
            await _context.SaveChangesAsync();
            return Ok(item);
        }

        [HttpDelete("languages/{id}")]
        public async Task<IActionResult> DeleteLanguage(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var item = await _context.SeekerLanguages
                .Include(l => l.Seeker)
                .FirstOrDefaultAsync(l => l.Id == id && l.Seeker!.UserId == userId);
            if (item == null) return NotFound();

            _context.SeekerLanguages.Remove(item);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Language deleted." });
        }

        // --- Certifications Endpoints ---
        [HttpPost("certifications")]
        public async Task<IActionResult> AddCertification([FromBody] CertificationDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var profile = await _context.SeekerProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
            if (profile == null) return NotFound("Profile not found.");

            var item = new SeekerCertification
            {
                SeekerId = profile.Id,
                Name = model.Name.Trim(),
                IssuingOrganization = model.IssuingOrganization.Trim(),
                IssueDate = model.IssueDate,
                ExpiryDate = model.ExpiryDate,
                CredentialUrl = model.CredentialUrl
            };

            _context.SeekerCertifications.Add(item);
            await _context.SaveChangesAsync();
            return Ok(item);
        }

        [HttpDelete("certifications/{id}")]
        public async Task<IActionResult> DeleteCertification(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var item = await _context.SeekerCertifications
                .Include(c => c.Seeker)
                .FirstOrDefaultAsync(c => c.Id == id && c.Seeker!.UserId == userId);
            if (item == null) return NotFound();

            _context.SeekerCertifications.Remove(item);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Certification deleted." });
        }
    }

    public class SeekerProfileDto
    {
        public string? CareerTitle { get; set; }
        public string? Bio { get; set; }
        public string? Experience { get; set; }
        public string? Education { get; set; }
        public string? Location { get; set; }
        public string? LinkedInUrl { get; set; }
        public string? PortfolioUrl { get; set; }
        public bool? IsOpenToWork { get; set; }
    }

    public class ToggleOpenToWorkDto
    {
        public bool IsOpenToWork { get; set; }
    }

    public class WorkHistoryDto
    {
        public string JobTitle { get; set; } = string.Empty;
        public string Company { get; set; } = string.Empty;
        public string? Location { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool IsCurrent { get; set; }
        public string? Description { get; set; }
    }

    public class EducationDto
    {
        public string Institution { get; set; } = string.Empty;
        public string Degree { get; set; } = string.Empty;
        public string? FieldOfStudy { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool IsCurrent { get; set; }
    }

    public class SkillDto
    {
        public string SkillName { get; set; } = string.Empty;
        public int? YearsExperience { get; set; }
    }

    public class LanguageDto
    {
        public string Language { get; set; } = string.Empty;
        public string Proficiency { get; set; } = "Conversational";
    }

    public class CertificationDto
    {
        public string Name { get; set; } = string.Empty;
        public string IssuingOrganization { get; set; } = string.Empty;
        public DateTime? IssueDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public string? CredentialUrl { get; set; }
    }

    public class AddResumeDto
    {
        public string? Title { get; set; }
        public IFormFile File { get; set; } = null!;
        public bool IsDefault { get; set; } = false;
    }
}
