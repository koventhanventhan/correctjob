namespace HireConnect.API.DTOs
{
    public class EmployerAnalyticsDto
    {
        public int TotalJobs { get; set; }
        public int TotalViews { get; set; }
        public int TotalApplications { get; set; }
        public double OverallConversionRate { get; set; }
        public List<DailyTrendDto> DailyTrends { get; set; } = new();
        public List<JobAnalyticsItemDto> JobStats { get; set; } = new();
    }

    public class DailyTrendDto
    {
        public string Date { get; set; } = string.Empty; // YYYY-MM-DD
        public int Views { get; set; }
        public int Applications { get; set; }
    }

    public class JobAnalyticsItemDto
    {
        public int JobId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int ViewsCount { get; set; }
        public int ApplicationsCount { get; set; }
        public double ConversionRate { get; set; }
        public DateTime? Deadline { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
