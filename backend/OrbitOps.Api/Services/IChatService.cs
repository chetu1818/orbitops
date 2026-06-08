using OrbitOps.Api.Models;

namespace OrbitOps.Api.Services;

public interface IChatService
{
    Task<ChatResponseDto> GetChatResponseAsync(ChatRequestDto request);
    Task SubmitFeedbackAsync(ChatFeedbackDto feedback);
}

