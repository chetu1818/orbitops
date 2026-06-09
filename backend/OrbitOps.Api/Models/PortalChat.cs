using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace OrbitOps.Api.Models
{
    public class ChatMessage
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string SenderId { get; set; } = string.Empty;

        [Required]
        public string SenderName { get; set; } = string.Empty;

        [Required]
        public string Content { get; set; } = string.Empty;

        public DateTime SentAt { get; set; } = DateTime.UtcNow;
    }

    public class ChatSession
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string Title { get; set; } = string.Empty; // Group chat name, or empty for 1-to-1

        public List<string> ParticipantIds { get; set; } = new();

        public List<ChatMessage> Messages { get; set; } = new();

        public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;
    }

    public class CreateChatDto
    {
        [Required]
        public List<string> ParticipantIds { get; set; } = new();

        public string Title { get; set; } = string.Empty;
    }

    public class SendMessageDto
    {
        [Required]
        public string SessionId { get; set; } = string.Empty;

        [Required]
        public string Content { get; set; } = string.Empty;
    }

    public class AddParticipantDto
    {
        [Required]
        public string SessionId { get; set; } = string.Empty;

        [Required]
        public string UserId { get; set; } = string.Empty;
    }
}
