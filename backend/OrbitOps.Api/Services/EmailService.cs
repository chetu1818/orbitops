using System.Net;
using System.Net.Mail;
using OrbitOps.Api.Models;

namespace OrbitOps.Api.Services
{
    public interface IEmailService
    {
        Task<bool> SendOrderReceiptEmailAsync(string clientEmail, string clientName, Order order);
        Task<bool> SendTwoFactorCodeEmailAsync(string clientEmail, string clientName, string code);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration config, ILogger<EmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task<bool> SendOrderReceiptEmailAsync(string clientEmail, string clientName, Order order)
        {
            var host = _config["Smtp:Host"];
            var portStr = _config["Smtp:Port"];
            var user = _config["Smtp:Username"];
            var pass = _config["Smtp:Password"];
            var from = _config["Smtp:FromAddress"] ?? "receipts@orbitops.ai";

            var htmlContent = $@"
<!DOCTYPE html>
<html>
<head>
  <style>
    body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; color: #1f2937; margin: 0; padding: 20px; }}
    .card {{ max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden; }}
    .header {{ background: #04120a; color: #10b981; padding: 25px; text-align: center; border-bottom: 2px solid #10b981; }}
    .header h2 {{ margin: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.02em; }}
    .header span {{ color: #a7f3d0; font-size: 14px; }}
    .body {{ padding: 30px; }}
    .greeting {{ font-size: 16px; margin-bottom: 20px; }}
    .table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
    .table th, .table td {{ padding: 10px; text-align: left; border-bottom: 1px solid #f3f4f6; font-size: 14px; }}
    .table th {{ color: #6b7280; font-weight: 500; width: 40%; }}
    .table td {{ color: #1f2937; font-weight: bold; }}
    .total-row {{ background-color: #f9fafb; font-size: 16px !important; }}
    .total-row td {{ color: #10b981 !important; font-size: 18px !important; }}
    .footer {{ background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }}
  </style>
</head>
<body>
  <div class='card'>
    <div class='header'>
      <h2>OrbitOps.ai</h2>
      <span>INTEGRATION GATEWAY RECEIPT</span>
    </div>
    <div class='body'>
      <p class='greeting'>Hello <strong>{clientName}</strong>,</p>
      <p>Thank you for your business. Your integration workflow has been securely queued and assigned to one of our expert automation architects.</p>
      
      <table class='table'>
        <tr>
          <th>Order ID</th>
          <td>{order.Id}</td>
        </tr>
        <tr>
          <th>Scenario Category</th>
          <td>{order.WorkflowType}</td>
        </tr>
        <tr>
          <th>Data Flow Route</th>
          <td>{order.SourceSystem} &rarr; {order.DestinationSystem}</td>
        </tr>
        <tr>
          <th>Assigned Engineer</th>
          <td>{order.EngineerName}</td>
        </tr>
        <tr>
          <th>Status</th>
          <td>Awaiting Assignment / Setup</td>
        </tr>
        <tr class='total-row'>
          <th>Amount Paid</th>
          <td>${order.Price} USD</td>
        </tr>
      </table>
      
      <p style='font-size: 13px; color: #4b5563; line-height: 1.5;'>
        Our security middleware automatically detected your connection credentials. The engineer has begun mapping the schema. You will receive progress notifications in your Client Portal.
      </p>
    </div>
    <div class='footer'>
      © 2026 OrbitOps.ai. All rights reserved.<br/>
      Secure Enterprise Automation & API Middleware Pipelines.
    </div>
  </div>
</body>
</html>";

            // If SMTP is not configured, fallback to logging the email
            if (string.IsNullOrWhiteSpace(host))
            {
                _logger.LogWarning($"[EMAIL SIMULATION] To: {clientEmail} ({clientName})\nSubject: OrbitOps Order Receipt {order.Id}\nPrice: ${order.Price} USD\nPath: {order.SourceSystem} -> {order.DestinationSystem}");
                
                // Write simulation receipt file to chat_data for inspection
                try
                {
                    var receiptDir = Path.Combine(Directory.GetCurrentDirectory(), "chat_data", "receipts");
                    if (!Directory.Exists(receiptDir)) Directory.CreateDirectory(receiptDir);
                    var receiptPath = Path.Combine(receiptDir, $"{order.Id}.html");
                    await File.WriteAllTextAsync(receiptPath, htmlContent);
                    _logger.LogInformation($"[EMAIL SIMULATION] Receipt HTML saved to: {receiptPath}");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to save simulated receipt file.");
                }

                return true;
            }

            try
            {
                using var client = new SmtpClient(host, int.Parse(portStr ?? "587"))
                {
                    Credentials = new NetworkCredential(user, pass),
                    EnableSsl = true
                };

                using var mailMessage = new MailMessage
                {
                    From = new MailAddress(from),
                    Subject = $"OrbitOps Order Receipt - {order.Id}",
                    Body = htmlContent,
                    IsBodyHtml = true
                };

                mailMessage.To.Add(clientEmail);

                await client.SendMailAsync(mailMessage);
                _logger.LogInformation($"Real receipt email sent successfully to {clientEmail} for order {order.Id}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending real SMTP email to {clientEmail}. Falling back to simulation mode.");
                
                try
                {
                    var receiptDir = Path.Combine(Directory.GetCurrentDirectory(), "chat_data", "receipts");
                    if (!Directory.Exists(receiptDir)) Directory.CreateDirectory(receiptDir);
                    var receiptPath = Path.Combine(receiptDir, $"{order.Id}.html");
                    await File.WriteAllTextAsync(receiptPath, htmlContent);
                    _logger.LogInformation($"[EMAIL SIMULATION-FALLBACK] Receipt HTML saved to: {receiptPath}");
                }
                catch (Exception fileEx)
                {
                    _logger.LogError(fileEx, "Failed to save simulated receipt file during fallback.");
                }

                return true;
            }
        }

        public async Task<bool> SendTwoFactorCodeEmailAsync(string clientEmail, string clientName, string code)
        {
            var host = _config["Smtp:Host"];
            var portStr = _config["Smtp:Port"];
            var user = _config["Smtp:Username"];
            var pass = _config["Smtp:Password"];
            var from = _config["Smtp:FromAddress"] ?? "auth@orbitops.ai";

            var htmlContent = $@"
<!DOCTYPE html>
<html>
<head>
  <style>
    body {{ font-family: Arial, sans-serif; background-color: #f3f4f6; color: #1f2937; margin: 0; padding: 20px; }}
    .card {{ max-width: 450px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden; }}
    .header {{ background: #04120a; color: #10b981; padding: 20px; text-align: center; border-bottom: 2px solid #10b981; }}
    .header h2 {{ margin: 0; font-size: 22px; font-weight: bold; }}
    .body {{ padding: 25px; text-align: center; }}
    .code-box {{ display: inline-block; font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 5px; padding: 15px 30px; background: #f3f4f6; border-radius: 8px; margin: 20px 0; border: 1px dashed #10b981; }}
    .footer {{ background: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; }}
  </style>
</head>
<body>
  <div class='card'>
    <div class='header'>
      <h2>OrbitOps.ai</h2>
    </div>
    <div class='body'>
      <p>Hello <strong>{clientName}</strong>,</p>
      <p>Please enter the following 6-digit verification code to complete your sign-in request:</p>
      <div class='code-box'>{code}</div>
      <p style='font-size: 12px; color: #6b7280;'>This code is valid for 10 minutes. If you did not make this request, please secure your account immediately.</p>
    </div>
    <div class='footer'>
      © 2026 OrbitOps.ai. B2B Integration Security Systems.
    </div>
  </div>
</body>
</html>";

            // If SMTP is not configured, fallback to logging and saving to text file
            if (string.IsNullOrWhiteSpace(host))
            {
                _logger.LogWarning($"[2FA EMAIL SIMULATION] To: {clientEmail} ({clientName})\nVerification Code: {code}");

                try
                {
                    var emailDir = Path.Combine(Directory.GetCurrentDirectory(), "chat_data", "emails");
                    if (!Directory.Exists(emailDir)) Directory.CreateDirectory(emailDir);
                    var emailPath = Path.Combine(emailDir, $"2fa_{clientEmail.Replace("@", "_")}_{code}.txt");
                    await File.WriteAllTextAsync(emailPath, $"To: {clientEmail}\nName: {clientName}\nCode: {code}\nTimestamp: {DateTime.UtcNow}\n\nHtml:\n{htmlContent}");
                    _logger.LogInformation($"[2FA EMAIL SIMULATION] Code saved to local file: {emailPath}");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to save simulated 2FA verification email file.");
                }

                return true;
            }

            try
            {
                using var client = new SmtpClient(host, int.Parse(portStr ?? "587"))
                {
                    Credentials = new NetworkCredential(user, pass),
                    EnableSsl = true
                };

                using var mailMessage = new MailMessage
                {
                    From = new MailAddress(from),
                    Subject = $"OrbitOps Sign-In Verification Code: {code}",
                    Body = htmlContent,
                    IsBodyHtml = true
                };

                mailMessage.To.Add(clientEmail);

                await client.SendMailAsync(mailMessage);
                _logger.LogInformation($"Real 2FA verification email sent successfully to {clientEmail}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending real SMTP 2FA email to {clientEmail}. Falling back to simulation.");
                
                try
                {
                    var emailDir = Path.Combine(Directory.GetCurrentDirectory(), "chat_data", "emails");
                    if (!Directory.Exists(emailDir)) Directory.CreateDirectory(emailDir);
                    var emailPath = Path.Combine(emailDir, $"2fa_{clientEmail.Replace("@", "_")}_{code}.txt");
                    await File.WriteAllTextAsync(emailPath, $"To: {clientEmail}\nName: {clientName}\nCode: {code}\nTimestamp: {DateTime.UtcNow}\n\nHtml:\n{htmlContent}");
                    _logger.LogInformation($"[2FA EMAIL SIMULATION-FALLBACK] Code saved to local file: {emailPath}");
                }
                catch (Exception fileEx)
                {
                    _logger.LogError(fileEx, "Failed to save simulated 2FA verification email file during fallback.");
                }

                return true;
            }
        }
    }
}
