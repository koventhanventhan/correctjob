using System.Security.Claims;
using HireConnect.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Caching.Memory;

namespace HireConnect.API.Middleware
{
    public class MustChangePasswordMiddleware
    {
        private readonly RequestDelegate _next;

        public MustChangePasswordMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, IMemoryCache memoryCache, UserManager<User> userManager)
        {
            var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";

            // Check if request is to an allowed endpoint where changing password or session handling is permitted
            if (path == "/api/auth/change-password" ||
                path == "/api/auth/logout" ||
                path == "/api/auth/refresh-token" ||
                path == "/api/auth/login" ||
                path == "/api/settings/maintenance-status" ||
                path == "/api/health" ||
                path.StartsWith("/swagger") ||
                path == "/favicon.ico")
            {
                await _next(context);
                return;
            }

            // If user is authenticated, verify whether password change is mandatory
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? context.User.FindFirstValue("sub");
                if (!string.IsNullOrEmpty(userId))
                {
                    var cacheKey = $"user_token_val_{userId}";
                    if (!memoryCache.TryGetValue(cacheKey, out UserValidationCacheItem? cached))
                    {
                        var user = await userManager.FindByIdAsync(userId);
                        if (user != null)
                        {
                            var roles = await userManager.GetRolesAsync(user);
                            var currentRole = roles.FirstOrDefault() ?? "JobSeeker";
                            cached = new UserValidationCacheItem(
                                user.IsActive,
                                currentRole,
                                user.SecurityStamp ?? "",
                                user.MustChangePassword
                            );
                            memoryCache.Set(cacheKey, cached, TimeSpan.FromSeconds(30));
                        }
                    }

                    if (cached != null && cached.MustChangePassword)
                    {
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        context.Response.ContentType = "application/json";
                        await context.Response.WriteAsync("{\"message\":\"Password change is required before accessing the platform.\",\"code\":\"PASSWORD_CHANGE_REQUIRED\"}");
                        return;
                    }
                }
            }

            await _next(context);
        }
    }
}
