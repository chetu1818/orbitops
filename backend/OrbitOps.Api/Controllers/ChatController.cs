using Microsoft.AspNetCore.Mvc;
using OrbitOps.Api.Models;
using OrbitOps.Api.Services;

namespace OrbitOps.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly ILogger<ChatController> _logger;

    public ChatController(IChatService chatService, ILogger<ChatController> logger)
    {
        _chatService = chatService;
        _logger = logger;
    }

    /// <summary>
    /// Forwards chatbot queries to Groq or falls back locally if not configured.
    /// </summary>
    /// <param name="request">The user message payload.</param>
    /// <returns>An IActionResult containing the response.</returns>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetResponse([FromBody] ChatRequestDto request)
    {
        _logger.LogInformation("Received chatbot query: '{Message}'", request.Message);

        try
        {
            if (string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new { error = "Message cannot be empty." });
            }

            var response = await _chatService.GetChatResponseAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing chat query '{Message}'", request.Message);
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = "An internal error occurred." });
        }
    }

    [HttpPost("feedback")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> SubmitFeedback([FromBody] ChatFeedbackDto request)
    {
        _logger.LogInformation("Received feedback: ConvId={ConvId}, Rating={Rating}", request.ConversationId, request.Rating);

        try
        {
            if (string.IsNullOrWhiteSpace(request.ConversationId))
            {
                return BadRequest(new { error = "ConversationId cannot be empty." });
            }

            await _chatService.SubmitFeedbackAsync(request);
            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting feedback for ConvId={ConvId}", request.ConversationId);
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = "An internal error occurred." });
        }
    }
}

