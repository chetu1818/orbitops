using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OrbitOps.Api.Data;
using OrbitOps.Api.Models;
using OrbitOps.Api.Services;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace OrbitOps.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatsController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly OrbitOpsDbContext _context;

        public ChatsController(IAuthService authService, OrbitOpsDbContext context)
        {
            _authService = authService;
            _context = context;
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
        public IActionResult GetMyChats()
        {
            var user = GetAuthenticatedUser();
            if (user == null)
            {
                return Unauthorized(new { message = "Session expired or invalid token." });
            }

            // Load all sessions with their messages and filter client-side since ParticipantIds utilizes conversion
            var myChats = _context.ChatSessions
                .Include(c => c.Messages)
                .ToList()
                .Where(c => c.ParticipantIds.Contains(user.Id))
                .OrderByDescending(c => c.LastMessageAt)
                .ToList();

            var allUsers = _context.Users.ToList();
            var result = myChats.Select(c => {
                var participants = allUsers
                    .Where(u => c.ParticipantIds.Contains(u.Id))
                    .Select(u => new { id = u.Id, name = u.Name, role = u.Role, email = u.Email })
                    .ToList();

                var displayTitle = c.Title;
                if (string.IsNullOrEmpty(displayTitle))
                {
                    var other = participants.FirstOrDefault(p => p.id != user.Id);
                    displayTitle = other?.name ?? "OrbitOps User";
                }

                return new
                {
                    id = c.Id,
                    title = displayTitle,
                    participantIds = c.ParticipantIds,
                    participants = participants,
                    messages = c.Messages.OrderBy(m => m.SentAt).ToList(),
                    lastMessageAt = c.LastMessageAt
                };
            });

            return Ok(result);
        }

        [HttpPost("create")]
        public IActionResult CreateChat([FromBody] CreateChatDto dto)
        {
            var user = GetAuthenticatedUser();
            if (user == null)
            {
                return Unauthorized(new { message = "Session expired or invalid token." });
            }

            if (!dto.ParticipantIds.Contains(user.Id))
            {
                dto.ParticipantIds.Add(user.Id);
            }

            // If it's a 1-to-1 chat, check if one already exists
            if (dto.ParticipantIds.Count == 2 && string.IsNullOrEmpty(dto.Title))
            {
                var existing = _context.ChatSessions
                    .ToList()
                    .FirstOrDefault(c => 
                        c.ParticipantIds.Count == 2 && 
                        c.ParticipantIds.Contains(dto.ParticipantIds[0]) && 
                        c.ParticipantIds.Contains(dto.ParticipantIds[1])
                    );

                if (existing != null)
                {
                    // Include messages
                    _context.Entry(existing).Collection(c => c.Messages).Load();
                    return Ok(existing);
                }
            }

            var newSession = new ChatSession
            {
                Id = Guid.NewGuid().ToString(),
                Title = dto.Title,
                ParticipantIds = dto.ParticipantIds,
                Messages = new List<ChatMessage>(),
                LastMessageAt = DateTime.UtcNow
            };

            newSession.Messages.Add(new ChatMessage
            {
                Id = Guid.NewGuid().ToString(),
                SenderId = "system",
                SenderName = "OrbitOps System",
                Content = $"Chat channel established.",
                SentAt = DateTime.UtcNow
            });

            _context.ChatSessions.Add(newSession);
            _context.SaveChanges();

            return Ok(newSession);
        }

        [HttpPost("message")]
        public IActionResult SendMessage([FromBody] SendMessageDto dto)
        {
            var user = GetAuthenticatedUser();
            if (user == null)
            {
                return Unauthorized(new { message = "Session expired or invalid token." });
            }

            var session = _context.ChatSessions
                .Include(c => c.Messages)
                .FirstOrDefault(c => c.Id == dto.SessionId);
            if (session == null)
            {
                return NotFound(new { message = "Chat session not found." });
            }

            if (!session.ParticipantIds.Contains(user.Id))
            {
                return Unauthorized(new { message = "You are not a participant in this chat." });
            }

            var newMessage = new ChatMessage
            {
                Id = Guid.NewGuid().ToString(),
                SenderId = user.Id,
                SenderName = user.Name,
                Content = dto.Content,
                SentAt = DateTime.UtcNow
            };

            session.Messages.Add(newMessage);
            session.LastMessageAt = DateTime.UtcNow;

            _context.SaveChanges();

            return Ok(newMessage);
        }

        [HttpPost("add-participant")]
        public IActionResult AddParticipant([FromBody] AddParticipantDto dto)
        {
            var user = GetAuthenticatedUser();
            if (user == null)
            {
                return Unauthorized(new { message = "Session expired or invalid token." });
            }

            var session = _context.ChatSessions
                .Include(c => c.Messages)
                .FirstOrDefault(c => c.Id == dto.SessionId);
            if (session == null)
            {
                return NotFound(new { message = "Chat session not found." });
            }

            if (!session.ParticipantIds.Contains(user.Id))
            {
                return Unauthorized(new { message = "You do not have permission to edit this chat." });
            }

            if (session.ParticipantIds.Contains(dto.UserId))
            {
                return BadRequest(new { message = "User is already in this chat." });
            }

            var addedUser = _context.Users.FirstOrDefault(u => u.Id == dto.UserId);
            if (addedUser == null)
            {
                return NotFound(new { message = "Target user not found." });
            }

            session.ParticipantIds.Add(dto.UserId);
            session.LastMessageAt = DateTime.UtcNow;

            session.Messages.Add(new ChatMessage
            {
                Id = Guid.NewGuid().ToString(),
                SenderId = "system",
                SenderName = "OrbitOps System",
                Content = $"{addedUser.Name} was added to the chat.",
                SentAt = DateTime.UtcNow
            });

            if (session.ParticipantIds.Count > 2 && string.IsNullOrEmpty(session.Title))
            {
                session.Title = "Group Discussion";
            }

            _context.SaveChanges();

            return Ok(session);
        }

        [HttpGet("search-users")]
        public IActionResult SearchUsers([FromQuery] string query = "")
        {
            var user = GetAuthenticatedUser();
            if (user == null)
            {
                return Unauthorized(new { message = "Session expired or invalid token." });
            }

            var matched = _context.Users
                .Where(u => u.Id != user.Id && 
                            (string.IsNullOrEmpty(query) || 
                             u.Name.Contains(query) || 
                             u.Email.Contains(query)))
                .Where(u => u.Role != "Engineer" || u.CurrentStatus == "Available")
                .Select(u => new
                {
                    id = u.Id,
                    name = u.Name,
                    email = u.Email,
                    role = u.Role,
                    company = u.Company,
                    status = u.CurrentStatus
                })
                .ToList();

            return Ok(matched);
        }

        public class RenameChatDto
        {
            [Required]
            public string SessionId { get; set; } = string.Empty;

            [Required]
            public string NewTitle { get; set; } = string.Empty;
        }

        [HttpPost("rename")]
        public IActionResult RenameChat([FromBody] RenameChatDto dto)
        {
            var user = GetAuthenticatedUser();
            if (user == null)
            {
                return Unauthorized(new { message = "Session expired or invalid token." });
            }

            var session = _context.ChatSessions.FirstOrDefault(c => c.Id == dto.SessionId);
            if (session == null)
            {
                return NotFound(new { message = "Chat session not found." });
            }

            if (!session.ParticipantIds.Contains(user.Id))
            {
                return Unauthorized(new { message = "You do not have permission to rename this chat." });
            }

            session.Title = dto.NewTitle;
            _context.SaveChanges();

            return Ok(new { message = "Chat renamed successfully.", title = session.Title });
        }
    }
}
