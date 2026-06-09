using Microsoft.AspNetCore.Mvc;
using OrbitOps.Api.Models;
using OrbitOps.Api.Services;
using System.ComponentModel.DataAnnotations;

namespace OrbitOps.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
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

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = _authService.Register(dto, out var error);
            if (user == null)
            {
                return BadRequest(new { message = error });
            }

            // Immediately register the client, but login will require 2FA later.
            // Let's generate a token for immediate convenience upon registration.
            var token = _authService.GenerateJwtToken(user);
            return Ok(new
            {
                token,
                user = new
                {
                    id = user.Id,
                    name = user.Name,
                    email = user.Email,
                    company = user.Company,
                    role = user.Role,
                    isAvailable = user.IsAvailable,
                    currentStatus = user.CurrentStatus
                }
            });
        }

        [HttpPost("add-engineer")]
        public IActionResult AddEngineer([FromBody] RegisterDto dto)
        {
            var admin = GetAuthenticatedUser();
            if (admin == null || admin.Role != "Admin")
            {
                return Unauthorized(new { message = "Only administrators can create engineer accounts." });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = _authService.RegisterEngineer(dto, out var error);
            if (user == null)
            {
                return BadRequest(new { message = error });
            }

            return Ok(new
            {
                id = user.Id,
                name = user.Name,
                email = user.Email,
                company = user.Company,
                role = user.Role,
                isAvailable = user.IsAvailable,
                currentStatus = user.CurrentStatus
            });
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = _authService.Login(dto, out var error);
            if (user == null)
            {
                return BadRequest(new { message = error });
            }

            // Bypass 2FA for all users
            var token = _authService.GenerateJwtToken(user);
            return Ok(new
            {
                twoFactorRequired = false,
                token,
                user = new
                {
                    id = user.Id,
                    name = user.Name,
                    email = user.Email,
                    company = user.Company,
                    role = user.Role,
                    isAvailable = user.IsAvailable,
                    currentStatus = user.CurrentStatus
                }
            });
        }

        [HttpPost("engineer-login")]
        public IActionResult EngineerLogin([FromBody] LoginDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = _authService.Login(dto, out var error);
            if (user == null)
            {
                return BadRequest(new { message = error });
            }

            if (user.Role != "Engineer")
            {
                return BadRequest(new { message = "Access denied. This portal is strictly for OrbitOps Automation Architects." });
            }

            // Bypass 2FA for Engineers
            var token = _authService.GenerateJwtToken(user);
            return Ok(new
            {
                twoFactorRequired = false,
                token,
                user = new
                {
                    id = user.Id,
                    name = user.Name,
                    email = user.Email,
                    company = user.Company,
                    role = user.Role,
                    isAvailable = user.IsAvailable,
                    currentStatus = user.CurrentStatus
                }
            });
        }

        [HttpPost("verify-2fa")]
        public IActionResult Verify2Fa([FromBody] Verify2FaDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = _authService.Confirm2Fa(dto.Email, dto.Code, out var error);
            if (user == null)
            {
                return BadRequest(new { message = error });
            }

            var token = _authService.GenerateJwtToken(user);
            return Ok(new
            {
                token,
                user = new
                {
                    id = user.Id,
                    name = user.Name,
                    email = user.Email,
                    company = user.Company,
                    role = user.Role,
                    isAvailable = user.IsAvailable,
                    currentStatus = user.CurrentStatus
                }
            });
        }

        [HttpGet("engineers")]
        public IActionResult GetEngineers()
        {
            var engineers = _authService.GetAvailableEngineers();
            var result = engineers.Select(e => new
            {
                name = e.Name,
                role = "Senior Integration Expert",
                avatarClass = "blue",
                rating = 4.9,
                projectsCount = 120,
                skills = new[] { "Make.com", "n8n", "APIs" }
            });
            return Ok(result);
        }

        [HttpPut("engineer-status")]
        public IActionResult UpdateEngineerStatus([FromBody] UpdateStatusDto dto)
        {
            var user = GetAuthenticatedUser();
            if (user == null || user.Role != "Engineer")
            {
                return Unauthorized(new { message = "Unauthorized or invalid session." });
            }

            var updated = _authService.UpdateEngineerStatus(user.Id, dto.Status, dto.IsAvailable);
            if (!updated)
            {
                return BadRequest(new { message = "Failed to update status." });
            }

            return Ok(new { message = "Status updated successfully." });
        }

        [HttpPost("add-sub-person")]
        public IActionResult AddSubPerson([FromBody] AddSubPersonDto dto)
        {
            var user = GetAuthenticatedUser();
            if (user == null || (user.Role != "Client" && user.Role != "SubClient"))
            {
                return Unauthorized(new { message = "Only primary client accounts can add sub-users." });
            }

            // Find main client id if currently logged in as sub-client
            var mainClientId = user.Role == "SubClient" ? user.ParentClientId! : user.Id;

            var subUser = _authService.AddSubPerson(mainClientId, dto, out var error);
            if (subUser == null)
            {
                return BadRequest(new { message = error });
            }

            return Ok(new
            {
                id = subUser.Id,
                name = subUser.Name,
                email = subUser.Email,
                role = subUser.Role
            });
        }

        [HttpGet("team")]
        public IActionResult GetTeam()
        {
            var user = GetAuthenticatedUser();
            if (user == null)
            {
                return Unauthorized(new { message = "Invalid token session." });
            }

            var mainClientId = user.Role == "SubClient" ? user.ParentClientId! : user.Id;
            var team = _authService.GetTeamMembers(mainClientId);
            var result = team.Select(t => new
            {
                id = t.Id,
                name = t.Name,
                email = t.Email,
                role = t.Role
            });

            return Ok(result);
        }
    }

    public class Verify2FaDto
    {
        [Required]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Code { get; set; } = string.Empty;
    }

    public class UpdateStatusDto
    {
        [Required]
        public string Status { get; set; } = "Available"; // "Available" or "Busy"

        [Required]
        public bool IsAvailable { get; set; } = true;
    }
}
