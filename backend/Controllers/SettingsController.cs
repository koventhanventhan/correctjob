using HireConnect.API.DTOs.Admin;
using HireConnect.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HireConnect.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    public class SettingsController : ControllerBase
    {
        private readonly ISystemSettingService _settingsService;

        public SettingsController(ISystemSettingService settingsService)
        {
            _settingsService = settingsService;
        }

        [HttpGet("public")]
        public async Task<IActionResult> GetPublicSettings()
        {
            var siteName = await _settingsService.GetSettingAsync("SiteName");
            if (string.IsNullOrWhiteSpace(siteName))
            {
                siteName = await _settingsService.GetSettingAsync("PlatformName", "HireConnect");
            }

            var contactEmail = await _settingsService.GetSettingAsync("ContactEmail", "support@hireconnect.com");
            var fee = await _settingsService.GetJobPostingFeeAsync();
            var maintenance = await _settingsService.IsMaintenanceModeAsync();

            return Ok(new PublicSettingsDto
            {
                SiteName = siteName,
                ContactEmail = contactEmail,
                JobPostingFee = fee,
                MaintenanceMode = maintenance
            });
        }

        [HttpGet]
        public Task<IActionResult> GetSettings() => GetPublicSettings();
    }
}
