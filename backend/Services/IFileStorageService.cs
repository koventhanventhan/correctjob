namespace HireConnect.API.Services
{
    public interface IFileStorageService
    {
        Task<string> UploadFileAsync(IFormFile file, string folderName);
        Task<bool> DeleteFileAsync(string fileUrl);
        string? GetPhysicalFilePath(string? fileUrlOrName, string? folderName = null);
        bool IsPrivateFolder(string folderName);
    }
}
