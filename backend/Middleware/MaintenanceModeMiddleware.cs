using HireConnect.API.Services;

namespace HireConnect.API.Middleware
{
    public class MaintenanceModeMiddleware
    {
        private readonly RequestDelegate _next;

        public MaintenanceModeMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, ISystemSettingService settingsService)
        {
            var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";

            // Always allow maintenance status and health checks so frontend/status monitors know the state
            if (path == "/api/settings/maintenance-status" || 
                path == "/api/health" ||
                path.StartsWith("/swagger") ||
                path == "/favicon.ico")
            {
                await _next(context);
                return;
            }

            var isMaintenance = await settingsService.IsMaintenanceModeAsync();
            if (!isMaintenance)
            {
                await _next(context);
                return;
            }

            // Maintenance mode is ON:
            // 1. Authenticated Admin users are NEVER locked out - allow all requests
            if (context.User.Identity?.IsAuthenticated == true && context.User.IsInRole("Admin"))
            {
                await _next(context);
                return;
            }

            // 2. Allow login and refresh-token endpoints through so Admins can authenticate
            // (Non-admin login attempts are checked and rejected in AuthController during maintenance)
            if (path == "/api/auth/login" || path == "/api/auth/refresh-token")
            {
                await _next(context);
                return;
            }

            // 3. All other requests from non-admins or anonymous users return 503 Service Unavailable
            context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync("{\"message\":\"The platform is currently undergoing scheduled maintenance. Please check back shortly.\",\"maintenance\":true}");
        }
    }
}
