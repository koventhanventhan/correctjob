using System.Net;
using System.Net.Mail;

namespace HireConnect.API.Services
{
    public class SmtpEmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<SmtpEmailService> _logger;

        public SmtpEmailService(
            IConfiguration configuration,
            IWebHostEnvironment env,
            ILogger<SmtpEmailService> logger)
        {
            _configuration = configuration;
            _env = env;
            _logger = logger;
        }

        public async Task SendPasswordResetEmailAsync(string toEmail, string resetToken)
        {
            var frontendUrl = _configuration["App:FrontendUrl"] 
                              ?? _configuration["FrontendUrl"] 
                              ?? "http://localhost:3000";

            var resetLink = $"{frontendUrl.TrimEnd('/')}/forgot-password?token={Uri.EscapeDataString(resetToken)}&email={Uri.EscapeDataString(toEmail)}";

            // Only print reset token/link in Development mode if the configuration flag is explicitly enabled
            var devPrintEnabled = _configuration.GetValue<bool>("EmailSettings:DevPrintTokenToConsole")
                                  || _configuration.GetValue<bool>("DevMode:PrintResetToken");

            if (_env.IsDevelopment() && devPrintEnabled)
            {
                Console.WriteLine($"[Dev Mode] Password reset link for {toEmail}: {resetLink} (Token: {resetToken})");
            }

            var subject = "HireConnect - Password Reset Request";
            var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f7f8; margin: 0; padding: 20px; }}
    .container {{ max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }}
    .header {{ text-align: center; margin-bottom: 24px; }}
    .logo {{ font-size: 24px; font-weight: bold; color: #ea580c; text-decoration: none; }}
    .btn {{ display: inline-block; padding: 12px 24px; background-color: #ea580c; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }}
    .footer {{ margin-top: 32px; font-size: 12px; color: #888888; text-align: center; }}
    .token-box {{ background: #f3f4f6; padding: 12px; border-radius: 6px; word-break: break-all; font-family: monospace; font-size: 13px; margin-top: 12px; }}
  </style>
</head>
<body>
  <div class='container'>
    <div class='header'>
      <a href='{frontendUrl}' class='logo'>HireConnect</a>
    </div>
    <h2>Reset Your Password</h2>
    <p>Hello,</p>
    <p>We received a request to reset the password for your HireConnect account associated with <strong>{toEmail}</strong>.</p>
    <p>Click the button below to reset your password. This link is valid for a limited time.</p>
    <p style='text-align: center;'>
      <a href='{resetLink}' class='btn'>Reset Password</a>
    </p>
    <p>Or copy and paste this URL into your browser:</p>
    <p class='token-box'><a href='{resetLink}'>{resetLink}</a></p>
    <p>If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    <div class='footer'>
      &copy; {DateTime.UtcNow.Year} HireConnect. All rights reserved.
    </div>
  </div>
</body>
</html>";

            await SendEmailAsync(toEmail, subject, htmlBody);
        }

        public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
        {
            var host = _configuration["EmailSettings:SmtpHost"] ?? _configuration["EmailSettings__SmtpHost"];
            var portString = _configuration["EmailSettings:SmtpPort"] ?? _configuration["EmailSettings__SmtpPort"];
            int.TryParse(portString, out var port);
            if (port <= 0) port = 587;

            var username = _configuration["EmailSettings:SmtpUsername"] ?? _configuration["EmailSettings__SmtpUsername"];
            var password = _configuration["EmailSettings:SmtpPassword"] ?? _configuration["EmailSettings__SmtpPassword"];
            var senderEmail = _configuration["EmailSettings:SenderEmail"] ?? _configuration["EmailSettings__SenderEmail"] ?? "noreply@hireconnect.com";
            var senderName = _configuration["EmailSettings:SenderName"] ?? _configuration["EmailSettings__SenderName"] ?? "HireConnect";
            
            var sslString = _configuration["EmailSettings:EnableSsl"] ?? _configuration["EmailSettings__EnableSsl"];
            var enableSsl = true;
            if (!string.IsNullOrEmpty(sslString) && bool.TryParse(sslString, out var parsedSsl))
            {
                enableSsl = parsedSsl;
            }

            if (string.IsNullOrWhiteSpace(host))
            {
                _logger.LogWarning("SMTP host is not configured. Email to {ToEmail} with subject '{Subject}' was not sent via SMTP.", toEmail, subject);
                return;
            }

            try
            {
                using var client = new SmtpClient(host, port)
                {
                    EnableSsl = enableSsl
                };

                if (!string.IsNullOrEmpty(username))
                {
                    client.Credentials = new NetworkCredential(username, password);
                }

                using var mailMessage = new MailMessage
                {
                    From = new MailAddress(senderEmail, senderName),
                    Subject = subject,
                    Body = htmlBody,
                    IsBodyHtml = true
                };
                mailMessage.To.Add(toEmail);

                await client.SendMailAsync(mailMessage);
                _logger.LogInformation("Email sent successfully to {ToEmail}", toEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {ToEmail} via SMTP host {Host}:{Port}", toEmail, host, port);
                // In production, log and do not let SMTP crash the endpoint
            }
        }
    }
}
