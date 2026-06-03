using System.ComponentModel.DataAnnotations;

namespace OrbitOps.Api.Models;

/// <summary>
/// Represents a lead capture submission from the OrbitOps landing page.
/// </summary>
public class LeadSubmission
{
    [Required(ErrorMessage = "Name is required.")]
    [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Company name is required.")]
    [StringLength(100, ErrorMessage = "Company name cannot exceed 100 characters.")]
    public string Company { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email address is required.")]
    [EmailAddress(ErrorMessage = "Invalid email address format.")]
    [StringLength(150, ErrorMessage = "Email cannot exceed 150 characters.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Description of the manual process is required.")]
    [StringLength(2000, MinimumLength = 20, ErrorMessage = "Please describe the process in at least 20 characters (maximum 2000).")]
    public string Message { get; set; } = string.Empty;
}
