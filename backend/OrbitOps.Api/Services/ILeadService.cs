using OrbitOps.Api.Models;

namespace OrbitOps.Api.Services;

/// <summary>
/// Service interface for handling lead processing logic.
/// </summary>
public interface ILeadService
{
    /// <summary>
    /// Validates, stores, and processes the submitted lead.
    /// </summary>
    /// <param name="lead">The lead submission payload.</param>
    /// <returns>A boolean indicating success or failure of the processing.</returns>
    Task<bool> ProcessLeadAsync(LeadSubmission lead);
}
