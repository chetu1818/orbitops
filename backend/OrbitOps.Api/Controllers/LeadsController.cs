using Microsoft.AspNetCore.Mvc;
using OrbitOps.Api.Models;
using OrbitOps.Api.Services;

namespace OrbitOps.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeadsController : ControllerBase
{
    private readonly ILeadService _leadService;
    private readonly ILogger<LeadsController> _logger;

    public LeadsController(ILeadService leadService, ILogger<LeadsController> logger)
    {
        _leadService = leadService;
        _logger = logger;
    }

    /// <summary>
    /// Processes a new lead submission from the landing page contact form.
    /// </summary>
    /// <param name="submission">The validation-annotated submission payload.</param>
    /// <returns>An IActionResult detailing success or error state.</returns>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> SubmitLead([FromBody] LeadSubmission submission)
    {
        _logger.LogInformation("Received POST request to submit a lead from {Email}.", submission.Email);

        try
        {
            // Note: DataAnnotations automatic validation handles basic checks,
            // but we can add secondary checks here if necessary.
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Lead validation failed for {Email}.", submission.Email);
                return BadRequest(ModelState);
            }

            var success = await _leadService.ProcessLeadAsync(submission);
            if (!success)
            {
                _logger.LogError("Internal processing failed for lead {Email}.", submission.Email);
                return StatusCode(StatusCodes.Status500InternalServerError, new { error = "Failed to process lead." });
            }

            return Ok(new { message = "Lead successfully submitted. The OrbitOps team will contact you shortly." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred while processing lead from {Email}.", submission.Email);
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = "An internal server error occurred." });
        }
    }
}
