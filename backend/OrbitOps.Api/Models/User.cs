using System.ComponentModel.DataAnnotations;

namespace OrbitOps.Api.Models
{
    public class User
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(150)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Company { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public string Role { get; set; } = "Client"; // "Client", "SubClient", "Engineer", "Admin"
        
        public string? ParentClientId { get; set; } // Only for "SubClient"

        public bool IsAvailable { get; set; } = true; // For "Engineer"

        public string CurrentStatus { get; set; } = "Available"; // "Available", "Busy" for "Engineer"

        public bool IsDisabled { get; set; } = false;

        public string? TwoFactorCode { get; set; }

        public DateTime? TwoFactorExpiry { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class RegisterDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Company { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;
    }

    public class AddSubPersonDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;
    }

    public class LoginDto
    {
        [Required]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }
}
