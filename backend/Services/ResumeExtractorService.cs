using System.IO;
using System.Text;
using System.Threading.Tasks;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using UglyToad.PdfPig;
using UglyToad.PdfPig.DocumentLayoutAnalysis.TextExtractor;

namespace HireConnect.API.Services
{
    public interface IResumeExtractorService
    {
        Task<string?> ExtractTextAsync(Stream fileStream, string contentType);
    }

    public class ResumeExtractorService : IResumeExtractorService
    {
        public Task<string?> ExtractTextAsync(Stream fileStream, string contentType)
        {
            try
            {
                if (contentType == "application/pdf")
                {
                    return Task.FromResult(ExtractPdfText(fileStream));
                }
                else if (contentType == "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
                {
                    return Task.FromResult(ExtractDocxText(fileStream));
                }
                
                return Task.FromResult<string?>(null);
            }
            catch
            {
                return Task.FromResult<string?>(null);
            }
        }

        private string? ExtractPdfText(Stream stream)
        {
            using var document = PdfDocument.Open(stream);
            var text = new StringBuilder();
            foreach (var page in document.GetPages())
            {
                var pageText = ContentOrderTextExtractor.GetText(page);
                text.AppendLine(pageText);
            }
            return text.ToString();
        }

        private string? ExtractDocxText(Stream stream)
        {
            using var document = WordprocessingDocument.Open(stream, false);
            var body = document.MainDocumentPart?.Document.Body;
            return body?.InnerText;
        }
    }
}
