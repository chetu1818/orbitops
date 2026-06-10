using Microsoft.AspNetCore.Mvc;
using OrbitOps.Api.Models;
using OrbitOps.Api.Services;
using System.ComponentModel.DataAnnotations;

namespace OrbitOps.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;
        private readonly IAuthService _authService;
        private readonly IEmailService _emailService;
        private readonly OrbitOps.Api.Data.OrbitOpsDbContext _context;
        private readonly ILogger<OrdersController> _logger;

        public OrdersController(
            IOrderService orderService, 
            IAuthService authService, 
            IEmailService emailService,
            OrbitOps.Api.Data.OrbitOpsDbContext context,
            ILogger<OrdersController> logger)
        {
            _orderService = orderService;
            _authService = authService;
            _emailService = emailService;
            _context = context;
            _logger = logger;
        }

        private User? GetAuthenticatedUser()
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            {
                return null;
            }

            var token = authHeader.Substring("Bearer ".Length).Trim();
            return _authService.ValidateToken(token);
        }

        [HttpGet]
        public IActionResult GetOrders()
        {
            var user = GetAuthenticatedUser();
            if (user == null)
            {
                return Unauthorized(new { message = "Session expired or invalid token." });
            }

            if (user.Role == "Admin")
            {
                // Admins see all pending reviews
                var pending = _orderService.GetPendingOrders();
                return Ok(pending);
            }
            else if (user.Role == "Engineer")
            {
                // Engineers see their assigned orders
                var assigned = _orderService.GetOrdersForEngineer(user.Name);
                return Ok(assigned);
            }
            else
            {
                // Clients see their orders
                var mainUserId = user.Role == "SubClient" ? user.ParentClientId! : user.Id;
                var orders = _orderService.GetOrdersForUser(mainUserId);
                return Ok(orders);
            }
        }

        [HttpPost]
        public IActionResult CreateOrder([FromBody] Order order)
        {
            var user = GetAuthenticatedUser();
            if (user == null)
            {
                return Unauthorized(new { message = "Session expired or invalid token." });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Defaults to "Awaiting Admin Review" with price preserved or 0, and Awaiting Review estimated time
            order.UserId = user.Role == "SubClient" ? user.ParentClientId! : user.Id;
            order.Status = "Awaiting Admin Review";
            order.Price = order.Price > 0 ? order.Price : 0; // Preserves client bid price if provided
            order.EstimatedCompletionTime = "Awaiting Review";

            var createdOrder = _orderService.CreateOrder(order);

            // Notify the engineer of the assignment in the background
            _ = Task.Run(async () =>
            {
                try
                {
                    var emailDir = Path.Combine(Directory.GetCurrentDirectory(), "chat_data", "emails");
                    if (!Directory.Exists(emailDir)) Directory.CreateDirectory(emailDir);
                    var notifyPath = Path.Combine(emailDir, $"notification_{order.EngineerName.Replace(" ", "_")}_{order.Id}.txt");
                    var content = $"To: {order.EngineerName}\n" +
                                  $"Subject: New Client Assignment - {order.Id}\n" +
                                  $"Body: Hello {order.EngineerName}, you have been assigned to construct a new integration workflow for client {user.Name} ({user.Company}).\n" +
                                  $"Workflow Scenario: {order.WorkflowType}\n" +
                                  $"Details: {order.SourceSystem} -> {order.DestinationSystem}\n" +
                                  $"Please log in to your Architect Workspace to inspect the credentials and instructions.";
                    await System.IO.File.WriteAllTextAsync(notifyPath, content);
                    _logger.LogInformation($"[ENGINEER NOTIFICATION] Notification saved to local file: {notifyPath}");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to write engineer notification file.");
                }
            });

            return Ok(createdOrder);
        }

        [HttpGet("pending")]
        public IActionResult GetPendingWorkflows()
        {
            var user = GetAuthenticatedUser();
            if (user == null || user.Role != "Admin")
            {
                return Unauthorized(new { message = "Admin privileges required." });
            }

            var pending = _orderService.GetPendingOrders();
            return Ok(pending);
        }

        [HttpPost("approve")]
        public IActionResult ApproveCosting([FromBody] ApproveWorkflowDto dto)
        {
            var user = GetAuthenticatedUser();
            if (user == null || user.Role != "Admin")
            {
                return Unauthorized(new { message = "Admin privileges required." });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var approved = _orderService.ApproveOrderCosting(dto.OrderId, dto.Price, dto.EstimatedCompletionTime);
            if (!approved)
            {
                return BadRequest(new { message = "Order not found or already approved." });
            }

            return Ok(new { message = "Workflow costing approved and sent to client." });
        }

        [HttpPost("client-approve")]
        public IActionResult ClientApprove([FromBody] ConfirmPaymentDto dto)
        {
            var user = GetAuthenticatedUser();
            if (user == null)
            {
                return Unauthorized(new { message = "Session expired or invalid token." });
            }

            var success = _orderService.ClientApproveCosting(dto.OrderId);
            if (!success)
            {
                return BadRequest(new { message = "Order not found or not in correct state for approval." });
            }

            return Ok(new { message = "Costing approved. Proceed to payment." });
        }

        [HttpPost("client-decline")]
        public IActionResult ClientDecline([FromBody] ConfirmPaymentDto dto)
        {
            var user = GetAuthenticatedUser();
            if (user == null)
            {
                return Unauthorized(new { message = "Session expired or invalid token." });
            }

            var success = _orderService.ClientDeclineCosting(dto.OrderId);
            if (!success)
            {
                return BadRequest(new { message = "Order not found or not in correct state for declining." });
            }

            return Ok(new { message = "Costing declined." });
        }

        [HttpPost("client-counter")]
        public IActionResult ClientCounter([FromBody] CounterBidDto dto)
        {
            var user = GetAuthenticatedUser();
            if (user == null)
            {
                return Unauthorized(new { message = "Session expired or invalid token." });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var success = _orderService.ClientCounterCosting(dto.OrderId, dto.CounterPrice);
            if (!success)
            {
                return BadRequest(new { message = "Order not found or not in correct state for countering." });
            }

            return Ok(new { message = "Counter-offer submitted to Admin." });
        }

        [HttpPost("pay")]
        public IActionResult ConfirmPayment([FromBody] ConfirmPaymentDto dto)
        {
            var user = GetAuthenticatedUser();
            if (user == null)
            {
                return Unauthorized(new { message = "Session expired or invalid token." });
            }

            var order = _orderService.CompleteOrderPayment(dto.OrderId);
            if (order != null)
            {
                // Programmatically establish a secure chat session and post all details/credentials
                try
                {
                    var client = _context.Users.FirstOrDefault(u => u.Id == order.UserId);
                    var engineer = _context.Users.FirstOrDefault(u => u.Name == order.EngineerName && u.Role == "Engineer");
                    if (client != null && engineer != null)
                    {
                        var existingSession = _context.ChatSessions.ToList().FirstOrDefault(s =>
                            s.ParticipantIds.Count == 2 &&
                            s.ParticipantIds.Contains(client.Id) &&
                            s.ParticipantIds.Contains(engineer.Id));

                        if (existingSession == null)
                        {
                            existingSession = new ChatSession
                            {
                                Id = Guid.NewGuid().ToString(),
                                Title = $"{client.Name} & {engineer.Name} (Order {order.Id})",
                                ParticipantIds = new List<string> { client.Id, engineer.Id },
                                Messages = new List<ChatMessage>(),
                                LastMessageAt = DateTime.UtcNow
                            };
                            _context.ChatSessions.Add(existingSession);
                        }

                        var sb = new System.Text.StringBuilder();
                        sb.AppendLine($"🔔 **Order Established & Paid: {order.Id}**");
                        sb.AppendLine($"**Client Name:** {client.Name} ({client.Company})");
                        sb.AppendLine($"**Client Email:** {client.Email}");
                        sb.AppendLine($"**Workflow Type:** {order.WorkflowType}");
                        sb.AppendLine($"**Route:** {order.SourceSystem} ➔ {order.DestinationSystem}");
                        sb.AppendLine($"**Instructions:** {order.Instructions}");
                        sb.AppendLine();
                        sb.AppendLine("🔑 **Source Credentials:**");
                        if (order.SourceCredentials != null && order.SourceCredentials.Any())
                        {
                            foreach (var kvp in order.SourceCredentials)
                            {
                                sb.AppendLine($"- **{kvp.Key}:** {kvp.Value}");
                            }
                        }
                        else
                        {
                            sb.AppendLine("None provided.");
                        }
                        sb.AppendLine();
                        sb.AppendLine("🔑 **Destination Credentials:**");
                        if (order.DestinationCredentials != null && order.DestinationCredentials.Any())
                        {
                            foreach (var kvp in order.DestinationCredentials)
                            {
                                sb.AppendLine($"- **{kvp.Key}:** {kvp.Value}");
                            }
                        }
                        else
                        {
                            sb.AppendLine("None provided.");
                        }

                        var detailsMessage = new ChatMessage
                        {
                            Id = Guid.NewGuid().ToString(),
                            SenderId = "system",
                            SenderName = "OrbitOps System",
                            Content = sb.ToString(),
                            SentAt = DateTime.UtcNow
                        };
                        existingSession.Messages.Add(detailsMessage);
                        existingSession.LastMessageAt = DateTime.UtcNow;

                        _context.SaveChanges();
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Failed to automatically establish chat session for order {order.Id}");
                }

                // Dispatch receipt email in background so it doesn't block the API response
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await _emailService.SendOrderReceiptEmailAsync(user.Email, user.Name, order);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Background email delivery failed for order {order.Id}");
                    }
                });

                return Ok(order);
            }

            return BadRequest(new { message = "Order not found or not in correct state for payment." });
        }

        [HttpGet("all")]
        public IActionResult GetAllOrdersForAdmin()
        {
            var user = GetAuthenticatedUser();
            if (user == null || user.Role != "Admin")
            {
                return Unauthorized(new { message = "Admin privileges required." });
            }
            var allOrders = _orderService.GetAllOrders();
            return Ok(allOrders);
        }

        [HttpPost("update-status")]
        public IActionResult UpdateStatus([FromBody] UpdateOrderStatusDto dto)
        {
            var user = GetAuthenticatedUser();
            if (user == null)
            {
                return Unauthorized(new { message = "Session expired or invalid token." });
            }

            if (user.Role != "Engineer" && user.Role != "Admin")
            {
                return Unauthorized(new { message = "Unauthorized to update order status." });
            }

            var success = _orderService.UpdateOrderStatus(dto.OrderId, dto.Status);
            if (!success)
            {
                return BadRequest(new { message = "Order not found." });
            }

            return Ok(new { message = "Order status updated successfully." });
        }

        [HttpPost("assign-engineer")]
        public IActionResult AssignEngineer([FromBody] AssignEngineerDto dto)
        {
            var user = GetAuthenticatedUser();
            if (user == null || user.Role != "Admin")
            {
                return Unauthorized(new { message = "Admin privileges required." });
            }

            var order = _context.Orders.FirstOrDefault(o => o.Id == dto.OrderId);
            if (order == null) return BadRequest(new { message = "Order not found." });

            var oldEngineer = order.EngineerName;
            var newEngineer = dto.EngineerName;

            if (!string.IsNullOrEmpty(oldEngineer) && oldEngineer != newEngineer)
            {
                var historyEntry = new HandoverHistoryEntry
                {
                    PreviousEngineer = oldEngineer,
                    NewEngineer = newEngineer,
                    ProgressSummary = string.IsNullOrWhiteSpace(dto.ProgressSummary) ? "No progress notes provided." : dto.ProgressSummary,
                    StatusAtHandover = order.Status,
                    HandoverDate = DateTime.UtcNow,
                    AdminUserId = user.Name
                };
                if (order.HandoverHistory == null)
                {
                    order.HandoverHistory = new List<HandoverHistoryEntry>();
                }
                order.HandoverHistory.Add(historyEntry);
            }

            order.EngineerName = newEngineer;
            
            if (order.Status == "Awaiting Assignment" || order.Status == "In Progress" || order.Status == "Completed" || order.Status.Contains("Setup") || order.Status.Contains("Schema") || order.Status.Contains("Sync"))
            {
                try
                {
                    var client = _context.Users.FirstOrDefault(u => u.Id == order.UserId);
                    var engineer = _context.Users.FirstOrDefault(u => u.Name == dto.EngineerName && u.Role == "Engineer");
                    if (client != null && engineer != null)
                    {
                        var existingSession = _context.ChatSessions.ToList().FirstOrDefault(s =>
                            s.ParticipantIds.Count == 2 &&
                            s.ParticipantIds.Contains(client.Id) &&
                            s.ParticipantIds.Contains(engineer.Id));

                        if (existingSession == null)
                        {
                            existingSession = new ChatSession
                            {
                                Id = Guid.NewGuid().ToString(),
                                Title = $"{client.Name} & {engineer.Name} (Order {order.Id})",
                                ParticipantIds = new List<string> { client.Id, engineer.Id },
                                Messages = new List<ChatMessage>(),
                                LastMessageAt = DateTime.UtcNow
                            };
                            _context.ChatSessions.Add(existingSession);
                        }

                        var sb = new System.Text.StringBuilder();
                        sb.AppendLine($"🔔 **Architect Assigned: {engineer.Name} is now leading Order {order.Id}**");
                        sb.AppendLine($"**Workflow Route:** {order.SourceSystem} ➔ {order.DestinationSystem}");

                        var reassignMessage = new ChatMessage
                        {
                            Id = Guid.NewGuid().ToString(),
                            SenderId = "system",
                            SenderName = "OrbitOps System",
                            Content = sb.ToString(),
                            SentAt = DateTime.UtcNow
                        };
                        existingSession.Messages.Add(reassignMessage);
                        existingSession.LastMessageAt = DateTime.UtcNow;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Failed to automatically reassign chat session for order {order.Id}");
                }
            }

            // Dispatch background email notification to newly assigned engineer
            if (!string.IsNullOrEmpty(newEngineer))
            {
                _ = Task.Run(async () =>
                {
                    try
                    {
                        var emailDir = Path.Combine(Directory.GetCurrentDirectory(), "chat_data", "emails");
                        if (!Directory.Exists(emailDir)) Directory.CreateDirectory(emailDir);
                        var notifyPath = Path.Combine(emailDir, $"notification_{newEngineer.Replace(" ", "_")}_{order.Id}.txt");
                        var content = $"To: {newEngineer}\n" +
                                      $"Subject: New Client Assignment - {order.Id}\n" +
                                      $"Body: Hello {newEngineer}, you have been assigned to construct a new integration workflow.\n" +
                                      $"Workflow Scenario: {order.WorkflowType}\n" +
                                      $"Details: {order.SourceSystem} -> {order.DestinationSystem}\n" +
                                      $"Please log in to your Architect Workspace to inspect the credentials and instructions.";
                        await System.IO.File.WriteAllTextAsync(notifyPath, content);
                        _logger.LogInformation($"[ENGINEER NOTIFICATION] Notification saved to local file: {notifyPath}");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to write engineer notification file.");
                    }
                });
            }

            _context.SaveChanges();
            return Ok(new { message = "Engineer assigned successfully." });
        }
    }

    public class ApproveWorkflowDto
    {
        [Required]
        public string OrderId { get; set; } = string.Empty;

        [Required]
        [Range(0.01, 100000.0)]
        public decimal Price { get; set; }

        [Required]
        public string EstimatedCompletionTime { get; set; } = string.Empty;
    }

    public class ConfirmPaymentDto
    {
        [Required]
        public string OrderId { get; set; } = string.Empty;
    }

    public class CounterBidDto
    {
        [Required]
        public string OrderId { get; set; } = string.Empty;

        [Required]
        [Range(0.01, 100000.0)]
        public decimal CounterPrice { get; set; }
    }

    public class UpdateOrderStatusDto
    {
        [Required]
        public string OrderId { get; set; } = string.Empty;

        [Required]
        public string Status { get; set; } = string.Empty;
    }

    public class AssignEngineerDto
    {
        [Required]
        public string OrderId { get; set; } = string.Empty;

        [Required]
        public string EngineerName { get; set; } = string.Empty;

        public string ProgressSummary { get; set; } = string.Empty;
    }
}
