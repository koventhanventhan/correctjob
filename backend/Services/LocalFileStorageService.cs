namespace HireConnect.API.Services
{
    public class LocalFileStorageService : IFileStorageService
    {
        private readonly IWebHostEnvironment _env;

        public LocalFileStorageService(IWebHostEnvironment env)
        {
            _env = env;
        }

        public bool IsPrivateFolder(string folderName)
        {
            if (string.IsNullOrWhiteSpace(folderName)) return false;
            var clean = folderName.Trim().ToLowerInvariant();
            return clean == "resumes" || clean == "id-cards" || clean == "idcards" || clean == "private";
        }

        public async Task<string> UploadFileAsync(IFormFile file, string folderName)
        {
            if (file == null || file.Length == 0) return string.Empty;

            var isPrivate = IsPrivateFolder(folderName);
            var rootDirName = isPrivate ? "private_uploads" : "uploads";
            var targetFolder = Path.Combine(_env.ContentRootPath, rootDirName, folderName);

            if (!Directory.Exists(targetFolder))
            {
                Directory.CreateDirectory(targetFolder);
            }

            var rawFileName = Path.GetFileName(file.FileName);
            var ext = Path.GetExtension(rawFileName)?.ToLowerInvariant() ?? "";

            var allowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                ".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".webp"
            };

            if (!allowedExtensions.Contains(ext))
            {
                throw new InvalidOperationException($"File type '{ext}' is not permitted.");
            }

            var uniqueFileName = $"{Guid.NewGuid():N}{ext}";
            var filePath = Path.Combine(targetFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            // Return relative path.
            // Private files: /private_uploads/{folderName}/{uniqueFileName}
            // Public files: /uploads/{folderName}/{uniqueFileName}
            return $"/{rootDirName}/{folderName}/{uniqueFileName}";
        }

        public Task<bool> DeleteFileAsync(string fileUrl)
        {
            if (string.IsNullOrEmpty(fileUrl)) return Task.FromResult(false);

            var filePath = GetPhysicalFilePath(fileUrl);
            if (!string.IsNullOrEmpty(filePath) && File.Exists(filePath))
            {
                File.Delete(filePath);
                return Task.FromResult(true);
            }

            return Task.FromResult(false);
        }

        public string? GetPhysicalFilePath(string? fileUrlOrName, string? folderName = null)
        {
            if (string.IsNullOrWhiteSpace(fileUrlOrName)) return null;

            var sanitized = fileUrlOrName.Trim().TrimStart('/', '\\').Replace('\\', '/');
            var fileName = Path.GetFileName(sanitized);

            // 1. Direct path check from ContentRootPath
            var directCandidate = Path.Combine(_env.ContentRootPath, sanitized);
            if (File.Exists(directCandidate)) return directCandidate;

            // 2. If folderName is supplied, search private_uploads then uploads
            if (!string.IsNullOrWhiteSpace(folderName))
            {
                var isPrivate = IsPrivateFolder(folderName);
                var primaryRoot = isPrivate ? "private_uploads" : "uploads";
                var secondaryRoot = isPrivate ? "uploads" : "private_uploads";

                var pCandidate = Path.Combine(_env.ContentRootPath, primaryRoot, folderName, fileName);
                if (File.Exists(pCandidate)) return pCandidate;

                var sCandidate = Path.Combine(_env.ContentRootPath, secondaryRoot, folderName, fileName);
                if (File.Exists(sCandidate)) return sCandidate;
            }

            // 3. Fallback checks if path mentions resumes or id-cards
            if (sanitized.Contains("resumes", StringComparison.OrdinalIgnoreCase))
            {
                var privateCandidate = Path.Combine(_env.ContentRootPath, "private_uploads", "resumes", fileName);
                if (File.Exists(privateCandidate)) return privateCandidate;

                var publicCandidate = Path.Combine(_env.ContentRootPath, "uploads", "resumes", fileName);
                if (File.Exists(publicCandidate)) return publicCandidate;
            }

            if (sanitized.Contains("id-cards", StringComparison.OrdinalIgnoreCase) || sanitized.Contains("idcards", StringComparison.OrdinalIgnoreCase))
            {
                var privateCandidate = Path.Combine(_env.ContentRootPath, "private_uploads", "id-cards", fileName);
                if (File.Exists(privateCandidate)) return privateCandidate;

                var publicCandidate = Path.Combine(_env.ContentRootPath, "uploads", "id-cards", fileName);
                if (File.Exists(publicCandidate)) return publicCandidate;
            }

            // 4. Check in WebRootPath if defined
            if (!string.IsNullOrEmpty(_env.WebRootPath))
            {
                var webCandidate = Path.Combine(_env.WebRootPath, sanitized);
                if (File.Exists(webCandidate)) return webCandidate;
            }

            return null;
        }
    }
}
