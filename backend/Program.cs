using HireConnect.API.Data;
using HireConnect.API.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using HireConnect.API.Services.Payment;

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

// Payment Services
builder.Services.AddScoped<IPaymentGatewayService, PayHereGatewayService>();

// Resume Services
builder.Services.AddHttpClient();
builder.Services.AddScoped<HireConnect.API.Services.IResumeExtractorService, HireConnect.API.Services.ResumeExtractorService>();
builder.Services.AddScoped<HireConnect.API.Services.IResumeMatchingService, HireConnect.API.Services.ResumeMatchingService>();

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
        }
    };
});

// Configure CORS
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? new[] { "http://localhost:3000" };

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

var app = builder.Build();

// Auto-apply migrations and seed roles
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<AppDbContext>();
    context.Database.Migrate();

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

app.MapControllers();
app.MapHub<HireConnect.API.Hubs.ChatHub>("/chatHub");

app.Run();
