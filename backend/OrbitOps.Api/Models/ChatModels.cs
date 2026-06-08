namespace OrbitOps.Api.Models;

public class ChatContextMessage
{
    public string Role { get; set; } = string.Empty; // "user" or "assistant"
    public string Content { get; set; } = string.Empty;
}

public class ChatRequestDto
{
    public string Message { get; set; } = string.Empty;
    public List<ChatContextMessage> Context { get; set; } = new();
    public string ConversationId { get; set; } = string.Empty;
}

public class ChatResponseDto
{
    public string Response { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public List<string> ResearchSteps { get; set; } = new();
    public string ConversationId { get; set; } = string.Empty;
}

public class ChatFeedbackDto
{
    public string ConversationId { get; set; } = string.Empty;
    public string UserMessage { get; set; } = string.Empty;
    public string AgentResponse { get; set; } = string.Empty;
    public int Rating { get; set; } // 1 for up, -1 for down
}

