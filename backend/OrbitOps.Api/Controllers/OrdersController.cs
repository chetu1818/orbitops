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
        private readonly ILogger<OrdersController> _logger;

        public OrdersController(
            IOrderService orderService, 
            IAuthService authService, 
            IEmailService emailService,
            ILogger<OrdersController> logger)
        {
            _orderService = orderService;
            _authService = authService;
            _emailService = emailService;
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

            // Defaults to "Awaiting Admin Review" with price 0 and Awaiting Review estimated time
            order.UserId = user.Role == "SubClient" ? user.ParentClientId! : user.Id;
            order.Status = "Awaiting Admin Review";
            order.Price = 0; // Cost is determined by Admin
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
}
