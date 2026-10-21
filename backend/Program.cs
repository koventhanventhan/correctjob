using HireConnect.API.Data;
using HireConnect.API.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using HireConnect.API.Services.Payment;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

// Load .env file if present
var currentDir = Directory.GetCurrentDirectory();
var envPath = File.Exists(Path.Combine(currentDir, ".env")) 
    ? Path.Combine(currentDir, ".env") 
    : (File.Exists(Path.Combine(currentDir, "..", ".env")) ? Path.Combine(currentDir, "..", ".env") : null);

if (envPath != null)
{
    foreach (var line in File.ReadAllLines(envPath))
    {
        var trimmed = line.Trim();
        if (string.IsNullOrEmpty(trimmed) || trimmed.StartsWith("#")) continue;
        var separatorIdx = trimmed.IndexOf('=');
        if (separatorIdx > 0)
        {
            var envKey = trimmed.Substring(0, separatorIdx).Trim();
            var envVal = trimmed.Substring(separatorIdx + 1).Trim();
            Environment.SetEnvironmentVariable(envKey, envVal);
        }
    }
}

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.TypeInfoResolver = new System.Text.Json.Serialization.Metadata.DefaultJsonTypeInfoResolver
        {
            Modifiers =
            {
                typeInfo =>
                {
                    if (typeInfo.Kind == System.Text.Json.Serialization.Metadata.JsonTypeInfoKind.Object)
                    {
                        foreach (var prop in typeInfo.Properties)
                        {
                            var name = prop.Name;
                            if (name.Equals("passwordHash", StringComparison.OrdinalIgnoreCase) ||
                                name.Equals("securityStamp", StringComparison.OrdinalIgnoreCase) ||
                                name.Equals("concurrencyStamp", StringComparison.OrdinalIgnoreCase) ||
                                name.Equals("normalizedEmail", StringComparison.OrdinalIgnoreCase) ||
                                name.Equals("normalizedUserName", StringComparison.OrdinalIgnoreCase) ||
                                name.Equals("accessFailedCount", StringComparison.OrdinalIgnoreCase) ||
                                name.Equals("lockoutEnd", StringComparison.OrdinalIgnoreCase))
                            {
                                prop.ShouldSerialize = (obj, val) => false;
                            }
                        }
                    }
                }
            }
        };
    });

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();

// File Storage
builder.Services.AddScoped<HireConnect.API.Services.IFileStorageService, HireConnect.API.Services.LocalFileStorageService>();

// Email Services
builder.Services.AddScoped<HireConnect.API.Services.IEmailService, HireConnect.API.Services.SmtpEmailService>();

// Background Services
builder.Services.AddHostedService<HireConnect.API.Services.JobAlertBackgroundService>();
builder.Services.AddHostedService<HireConnect.API.Services.JobExpiryBackgroundService>();

// Payment Services
builder.Services.AddScoped<IPaymentGatewayService, PayHereGatewayService>();

// Resume Services
builder.Services.AddHttpClient();
builder.Services.AddScoped<HireConnect.API.Services.IResumeExtractorService, HireConnect.API.Services.ResumeExtractorService>();
builder.Services.AddScoped<HireConnect.API.Services.IResumeMatchingService, HireConnect.API.Services.ResumeMatchingService>();

// Memory Cache
builder.Services.AddMemoryCache();

// Audit Logging & Platform Settings Services
builder.Services.AddScoped<HireConnect.API.Services.IAuditLogService, HireConnect.API.Services.AuditLogService>();
builder.Services.AddScoped<HireConnect.API.Services.ISystemSettingService, HireConnect.API.Services.SystemSettingService>();

// Configure Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))
    ));

// Configure Identity with Lockout settings
builder.Services.AddIdentity<User, IdentityRole>(options =>
{
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;
    options.User.RequireUniqueEmail = true;
})
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"],
        ClockSkew = TimeSpan.Zero
    };
    
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/chatHub"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        },
        OnTokenValidated = async context =>
        {
            var principal = context.Principal;
            if (principal == null) return;

            var userId = principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                         ?? principal.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                context.Fail("User identifier not found in token.");
                return;
            }

            var tokenRole = principal.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value 
                            ?? principal.FindFirst("role")?.Value;
            var tokenSecurityStamp = principal.FindFirst("security_stamp")?.Value 
                                     ?? principal.FindFirst(System.Security.Claims.ClaimTypes.SerialNumber)?.Value;

            var cache = context.HttpContext.RequestServices.GetRequiredService<Microsoft.Extensions.Caching.Memory.IMemoryCache>();
            var cacheKey = $"user_token_val_{userId}";

            if (!cache.TryGetValue(cacheKey, out UserValidationCacheItem? cached))
            {
                var userManager = context.HttpContext.RequestServices.GetRequiredService<UserManager<User>>();
                var user = await userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    context.Fail("User does not exist.");
                    return;
                }

                var roles = await userManager.GetRolesAsync(user);
                var currentRole = roles.FirstOrDefault() ?? "JobSeeker";

                cached = new UserValidationCacheItem(
                    user.IsActive,
                    currentRole,
                    user.SecurityStamp ?? "",
                    user.MustChangePassword
                );

                // Cache for 30 seconds to minimize DB lookups
                cache.Set(cacheKey, cached, TimeSpan.FromSeconds(30));
            }

            if (cached == null || !cached.IsActive)
            {
                context.Fail("User account has been blocked or deactivated.");
                return;
            }

            if (!string.IsNullOrEmpty(tokenSecurityStamp) && tokenSecurityStamp != cached.SecurityStamp)
            {
                context.Fail("Session has been invalidated.");
                return;
            }

            if (!string.IsNullOrEmpty(tokenRole) && !string.Equals(tokenRole, cached.Role, StringComparison.OrdinalIgnoreCase))
            {
                context.Fail("User role has changed.");
                return;
            }
        }
    };
});

// Configure upload limits (MaxRequestBodySize and FormOptions)
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 15 * 1024 * 1024; // 15 MB
    options.ValueLengthLimit = 1024 * 1024; // 1 MB
    options.MultipartHeadersLengthLimit = 16384;
});

builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 15 * 1024 * 1024; // 15 MB
});

// Configure ASP.NET Core IP-based Rate Limiter for auth endpoints
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsync(
            "{\"message\":\"Too many requests. Please try again later.\",\"statusCode\":429}",
            cancellationToken: token);
    };

    static string GetClientIp(HttpContext httpContext)
    {
        return httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown_ip";
    }

    // Login: 10 requests / min
    options.AddPolicy("LoginLimiter", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            GetClientIp(httpContext),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    // Register: 5 requests / min
    options.AddPolicy("RegisterLimiter", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            GetClientIp(httpContext),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    // Forgot Password & Reset Password: 3 requests / min
    options.AddPolicy("PasswordResetLimiter", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            GetClientIp(httpContext),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 3,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    // Refresh Token: 20 requests / min
    options.AddPolicy("RefreshTokenLimiter", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            GetClientIp(httpContext),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    // Change Password: 5 requests / min
    options.AddPolicy("ChangePasswordLimiter", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            GetClientIp(httpContext),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});

// Configure CORS - strictly loaded from configuration in production (no wildcard or AllowAnyOrigin)
var allowedOriginsConfig = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
string[] allowedOrigins;
if (builder.Environment.IsDevelopment())
{
    allowedOrigins = (allowedOriginsConfig != null && allowedOriginsConfig.Length > 0)
        ? allowedOriginsConfig
        : new[] { "http://localhost:3000" };
}
else
{
    if (allowedOriginsConfig == null || allowedOriginsConfig.Length == 0 || allowedOriginsConfig.Any(o => o.Trim() == "*"))
    {
        throw new InvalidOperationException("Production requires explicitly configured non-wildcard Cors:AllowedOrigins in configuration/environment variables.");
    }
    allowedOrigins = allowedOriginsConfig;
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Required for cookies
    });
});

// Configure ForwardedHeaders for reverse proxy / load balancer real IP detection
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    var allowAllProxies = builder.Configuration.GetValue<bool>("ForwardedHeaders:AllowAllProxies", true);
    if (allowAllProxies)
    {
        options.KnownIPNetworks.Clear();
        options.KnownProxies.Clear();
    }
});

// Validate or initialize Security:IpHashSalt
var ipHashSalt = builder.Configuration["Security:IpHashSalt"];
if (string.IsNullOrWhiteSpace(ipHashSalt))
{
    if (builder.Environment.IsDevelopment())
    {
        var randomBytes = new byte[32];
        using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        var generatedSalt = Convert.ToHexString(randomBytes).ToLowerInvariant();
        builder.Configuration["Security:IpHashSalt"] = generatedSalt;
    }
    else
    {
        throw new InvalidOperationException("Missing required configuration 'Security:IpHashSalt'. Set Security__IpHashSalt in environment variables.");
    }
}

// Production configuration validation: fail-fast on missing required configuration keys
if (!builder.Environment.IsDevelopment())
{
    var requiredProductionSettings = new (string ConfigPath, string EnvVarName)[]
    {
        ("ConnectionStrings:DefaultConnection", "ConnectionStrings__DefaultConnection"),
        ("Jwt:Key", "Jwt__Key"),
        ("Security:IpHashSalt", "Security__IpHashSalt"),
        ("Admin:Email", "Admin__Email"),
        ("Admin:Password", "Admin__Password"),
        ("EmailSettings:SmtpHost", "EmailSettings__SmtpHost"),
        ("EmailSettings:SmtpUsername", "EmailSettings__SmtpUsername"),
        ("EmailSettings:SmtpPassword", "EmailSettings__SmtpPassword"),
        ("PayHere:MerchantId", "PayHere__MerchantId"),
        ("PayHere:MerchantSecret", "PayHere__MerchantSecret")
    };

    var missingKeys = new List<string>();
    foreach (var (path, envVar) in requiredProductionSettings)
    {
        var val = builder.Configuration[path] ?? Environment.GetEnvironmentVariable(envVar);
        if (string.IsNullOrWhiteSpace(val) || val.Contains("CHANGE_ME") || val.StartsWith("your-", StringComparison.OrdinalIgnoreCase))
        {
            missingKeys.Add($"{path} (or {envVar})");
        }
    }

    if (missingKeys.Count > 0)
    {
        throw new InvalidOperationException(
            $"[FATAL STARTUP ERROR] Missing or placeholder configuration keys in Production environment:\n - " +
            string.Join("\n - ", missingKeys) +
            "\nPlease supply valid production credentials in environment variables.");
    }
}

var app = builder.Build();

app.UseForwardedHeaders();

// Security Headers Middleware (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, X-XSS-Protection, HSTS in production)
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["X-XSS-Protection"] = "1; mode=block";

    if (!app.Environment.IsDevelopment())
    {
        context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
    }

    await next();
});

// Seed roles and admin user (explicit migrations via dotnet ef database update)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<AppDbContext>();
    if (builder.Configuration.GetValue<bool>("Database:AutoMigrate", false))
    {
        context.Database.Migrate();
    }

    var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
    string[] roles = { "Admin", "Employer", "JobSeeker" };
    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
            await roleManager.CreateAsync(new IdentityRole(role));
    }

    // Seed admin user from environment variables / configuration only
    var adminEmail = builder.Configuration["Admin:Email"] 
                     ?? builder.Configuration["Admin__Email"] 
                     ?? Environment.GetEnvironmentVariable("Admin__Email");
    var adminPassword = builder.Configuration["Admin:Password"] 
                        ?? builder.Configuration["Admin__Password"] 
                        ?? Environment.GetEnvironmentVariable("Admin__Password");

    if (!string.IsNullOrWhiteSpace(adminEmail) && !string.IsNullOrWhiteSpace(adminPassword))
    {
        var userManager = services.GetRequiredService<UserManager<User>>();
        if (await userManager.FindByEmailAsync(adminEmail) == null)
        {
            var admin = new User { UserName = adminEmail, Email = adminEmail, FullName = "Admin User", IsActive = true };
            var createResult = await userManager.CreateAsync(admin, adminPassword);
            if (createResult.Succeeded)
            {
                await userManager.AddToRoleAsync(admin, "Admin");
            }
        }
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseRateLimiter();

var uploadsDir = Path.Combine(builder.Environment.ContentRootPath, "uploads");
if (!Directory.Exists(uploadsDir))
{
    Directory.CreateDirectory(uploadsDir);
}

// Private uploads (outside static uploads root) for sensitive files like resumes and id-cards
var privateUploadsDir = Path.Combine(builder.Environment.ContentRootPath, "private_uploads");
if (!Directory.Exists(privateUploadsDir))
{
    Directory.CreateDirectory(privateUploadsDir);
}

// Block direct static access to sensitive directories (resumes, id-cards, private uploads)
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";
    if (path.StartsWith("/uploads/resumes") || 
        path.StartsWith("/uploads/id-cards") || 
        path.StartsWith("/uploads/idcards") || 
        path.StartsWith("/private_uploads") ||
        path.StartsWith("/private-uploads"))
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsync("{\"message\":\"Forbidden: Direct static access to sensitive documents is not permitted. Please use authorized endpoints.\"}");
        return;
    }
    await next();
});

// Serve only public uploads (profile images, company logos)
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsDir),
    RequestPath = "/uploads",
    OnPrepareResponse = ctx =>
    {
        var path = ctx.Context.Request.Path.Value?.ToLowerInvariant() ?? "";
        // Extra defense-in-depth: Block sensitive folder access if placed in uploads
        if (path.StartsWith("/resumes") || path.StartsWith("/id-cards") || path.StartsWith("/idcards"))
        {
            ctx.Context.Response.StatusCode = StatusCodes.Status403Forbidden;
            ctx.Context.Response.ContentLength = 0;
            ctx.Context.Response.Body = Stream.Null;
        }
    }
});

app.UseAuthentication();
app.UseAuthorization();

// Maintenance Mode Middleware (Admin is never locked out, non-admins get 503 during maintenance)
app.UseMiddleware<HireConnect.API.Middleware.MaintenanceModeMiddleware>();

// MustChangePassword Middleware (Enforce password change for users flagged with MustChangePassword=true)
app.UseMiddleware<HireConnect.API.Middleware.MustChangePasswordMiddleware>();

app.MapGet("/api/settings/maintenance-status", async (HireConnect.API.Services.ISystemSettingService settings) =>
{
    var isMaintenance = await settings.IsMaintenanceModeAsync();
    return Results.Ok(new { maintenance = isMaintenance });
}).AllowAnonymous();

app.MapControllers();
app.MapHub<HireConnect.API.Hubs.ChatHub>("/chatHub");

app.Run();
