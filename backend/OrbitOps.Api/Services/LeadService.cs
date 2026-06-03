using OrbitOps.Api.Models;

namespace OrbitOps.Api.Services;

/// <summary>
/// Service implementation for handling lead processing and structured logging.
/// </summary>
public class LeadService : ILeadService
{
    private readonly ILogger<LeadService> _logger;

    public LeadService(ILogger<LeadService> logger)
    {
        _logger = logger;
    }

    public async Task<bool> ProcessLeadAsync(LeadSubmission lead)
    {
        _logger.LogInformation("Processing lead submission for Name: {Name}, Company: {Company}, Email: {Email}", 
            lead.Name, lead.Company, lead.Email);

        // Simulate async operation (e.g., storing in a database, dispatching to Make.com or n8n automation pipeline)
        await Task.Delay(150);

        _logger.LogInformation("Successfully processed and saved lead for {Email} at {Time}", 
            lead.Email, DateTime.UtcNow);

        return true;
    }
}
