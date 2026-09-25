using System.Text.Json;
using System.Text.Json.Serialization;
using System.Net.Http.Headers;

namespace HireConnect.API.Services
{
    public interface IResumeMatchingService
    {
        Task<(int score, string explanation)> MatchAsync(string? resumeText, string jobDescription);
    }

    public class ResumeMatchingService : IResumeMatchingService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;
        private readonly ILogger<ResumeMatchingService> _logger;

        public ResumeMatchingService(HttpClient httpClient, IConfiguration config, ILogger<ResumeMatchingService> logger)
        {
            _httpClient = httpClient;
            _config = config;
            _logger = logger;
        }

        public async Task<(int score, string explanation)> MatchAsync(string? resumeText, string jobDescription)
        {
            if (string.IsNullOrWhiteSpace(resumeText))
            {
                return (0, "Match score unavailable (No readable resume text provided).");
            }

            var apiKey = _config["Anthropic:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogWarning("Anthropic API key is missing. Skipping resume match.");
                return (0, "Match score unavailable (API key missing).");
            }

            try
            {
                var prompt = $@"
You are an expert technical recruiter and ATS software system.
Analyze the provided resume against the job description.
Provide a match score between 0 and 100 based on how well the candidate's skills and experience fit the requirements.
Also provide a concise 2-3 sentence explanation of why.

Output EXACTLY AND ONLY valid JSON in this format, with no markdown fences, no preamble, and no extra text:
{{
  ""score"": 85,
  ""explanation"": ""The candidate has strong React experience and exactly matches the required 5 years of frontend development. However, they lack the requested GraphQL experience.""
}}

<job_description>
{jobDescription}
</job_description>

<resume_text>
{resumeText}
</resume_text>
";

                var requestData = new
                {
                    model = "claude-3-5-sonnet-20240620", // Use sonnet 3.5 per instructions (or claude-3-sonnet-20240229)
                    max_tokens = 300,
                    messages = new[]
                    {
                        new { role = "user", content = prompt }
                    }
                };

                var request = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages");
                request.Headers.Add("x-api-key", apiKey);
                request.Headers.Add("anthropic-version", "2023-06-01");
                request.Content = new StringContent(JsonSerializer.Serialize(requestData), System.Text.Encoding.UTF8, "application/json");

                var response = await _httpClient.SendAsync(request);
                
                if (!response.IsSuccessStatusCode)
                {
                    var err = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Anthropic API returned error: {Status} {Error}", response.StatusCode, err);
                    return (0, "Match score unavailable (API error).");
                }

                var content = await response.Content.ReadAsStringAsync();
                
                // Parse Anthropic response structure
                using var jsonDoc = JsonDocument.Parse(content);
                var root = jsonDoc.RootElement;
                if (root.TryGetProperty("content", out var contentArray) && contentArray.GetArrayLength() > 0)
                {
                    var textResponse = contentArray[0].GetProperty("text").GetString();
                    if (!string.IsNullOrEmpty(textResponse))
                    {
                        textResponse = textResponse.Trim();
                        // Strip accidental markdown fences just in case
                        if (textResponse.StartsWith("```json"))
                        {
                            textResponse = textResponse.Substring(7);
                        }
                        if (textResponse.StartsWith("```"))
                        {
                            textResponse = textResponse.Substring(3);
                        }
                        if (textResponse.EndsWith("```"))
                        {
                            textResponse = textResponse.Substring(0, textResponse.Length - 3);
                        }

                        textResponse = textResponse.Trim();

                        var matchResult = JsonSerializer.Deserialize<MatchResult>(textResponse, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                        if (matchResult != null)
                        {
                            return (matchResult.Score, matchResult.Explanation ?? "Match score generated.");
                        }
                    }
                }

                return (0, "Match score unavailable (Failed to parse response).");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while calling Anthropic API for resume match.");
                return (0, "Match score unavailable (Internal error).");
            }
        }

        private class MatchResult
        {
            public int Score { get; set; }
            public string? Explanation { get; set; }
        }
    }
}
