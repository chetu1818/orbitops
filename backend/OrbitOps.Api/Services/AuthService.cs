using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using OrbitOps.Api.Data;
using OrbitOps.Api.Models;

namespace OrbitOps.Api.Services
{
    public interface IAuthService
    {
        User? Register(RegisterDto dto, out string error);
        User? RegisterEngineer(RegisterDto dto, out string error);
        User? Login(LoginDto dto, out string error);
        bool GenerateAndSend2FaCode(User user);
        User? Confirm2Fa(string email, string code, out string error);
        string GenerateJwtToken(User user);
        User? ValidateToken(string token);
        List<User> GetAvailableEngineers();
        bool UpdateEngineerStatus(string engineerId, string status, bool isAvailable);
        User? AddSubPerson(string parentClientId, AddSubPersonDto dto, out string error);
        List<User> GetTeamMembers(string parentClientId);
        List<User> GetAllUsers();
        void InitializeDatabase();
    }

    public class AuthService : IAuthService
    {
        private static readonly string SecretKey = "OrbitOpsSuperSecretEncryptionKeyForB2BPortalMatrix";
        private readonly OrbitOpsDbContext _context;
        private readonly IEmailService _emailService;

        public AuthService(OrbitOpsDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        public void InitializeDatabase()
        {
            if (!_context.Users.Any())
            {
                var seeded = SeedDefaultUsers();
                _context.Users.AddRange(seeded);
                _context.SaveChanges();
            }
        }

        private List<User> SeedDefaultUsers()
        {
            var users = new List<User>
            {
                new User
                {
                    Id = "usr-admin",
                    Name = "System Admin",
                    Email = "admin",
                    Company = "OrbitOps Operations",
                    PasswordHash = HashPassword("admin"),
                    Role = "Admin"
                },
                new User
                {
                    Id = "usr-chetan",
                    Name = "Chetan Patil",
                    Email = "chetan@orbit.ai",
                    Company = "OrbitOps Architects",
                    PasswordHash = HashPassword("password123"),
                    Role = "Engineer",
                    IsAvailable = true,
                    CurrentStatus = "Available"
                },
                new User
                {
                    Id = "usr-sarah",
                    Name = "Sarah Jenkins",
                    Email = "sarah@orbitops.ai",
                    Company = "OrbitOps Architects",
                    PasswordHash = HashPassword("password123"),
                    Role = "Engineer",
                    IsAvailable = true,
                    CurrentStatus = "Available"
                },
                new User
                {
                    Id = "usr-alex",
                    Name = "Alex Chen",
                    Email = "alex@orbitops.ai",
                    Company = "OrbitOps Architects",
                    PasswordHash = HashPassword("password123"),
                    Role = "Engineer",
                    IsAvailable = true,
                    CurrentStatus = "Available"
                },
                new User
                {
                    Id = "usr-marcus",
                    Name = "Marcus Vance",
                    Email = "marcus@orbitops.ai",
                    Company = "OrbitOps Architects",
                    PasswordHash = HashPassword("password123"),
                    Role = "Engineer",
                    IsAvailable = true,
                    CurrentStatus = "Available"
                },
                new User
                {
                    Id = "usr-elena",
                    Name = "Elena Rostova",
                    Email = "elena@orbitops.ai",
                    Company = "OrbitOps Architects",
                    PasswordHash = HashPassword("password123"),
                    Role = "Engineer",
                    IsAvailable = true,
                    CurrentStatus = "Available"
                },
                new User
                {
                    Id = "usr-client",
                    Name = "Jane Doe",
                    Email = "client@enterprise.com",
                    Company = "Enterprise Inc.",
                    PasswordHash = HashPassword("password123"),
                    Role = "Client"
                },
                new User
                {
                    Id = "90aa27cd-d76b-451b-b945-607ed2f37930",
                    Name = "Chetan Patil",
                    Email = "chetan@brainpayroll.co.uk",
                    Company = "Phase1",
                    PasswordHash = HashPassword("password123"),
                    Role = "Client"
                }
            };
            return users;
        }

        public User? Register(RegisterDto dto, out string error)
        {
            error = string.Empty;

            if (_context.Users.Any(u => u.Email.ToLower() == dto.Email.ToLower()))
            {
                error = "Email address is already registered.";
                return null;
            }

            var user = new User
            {
                Name = dto.Name,
                Email = dto.Email.ToLowerInvariant(),
                Company = dto.Company,
                PasswordHash = HashPassword(dto.Password),
                Role = "Client"
            };

            _context.Users.Add(user);
            _context.SaveChanges();
            return user;
        }

        public User? RegisterEngineer(RegisterDto dto, out string error)
        {
            error = string.Empty;

            if (_context.Users.Any(u => u.Email.ToLower() == dto.Email.ToLower()))
            {
                error = "Email address is already registered.";
                return null;
            }

            var user = new User
            {
                Name = dto.Name,
                Email = dto.Email.ToLowerInvariant(),
                Company = string.IsNullOrWhiteSpace(dto.Company) ? "OrbitOps Architects" : dto.Company,
                PasswordHash = HashPassword(dto.Password),
                Role = "Engineer",
                IsAvailable = true,
                CurrentStatus = "Available"
            };

            _context.Users.Add(user);
            _context.SaveChanges();
            return user;
        }

        public User? Login(LoginDto dto, out string error)
        {
            error = string.Empty;
            var user = _context.Users.FirstOrDefault(u => u.Email.ToLower() == dto.Email.ToLower());

            if (user == null || !VerifyPassword(dto.Password, user.PasswordHash))
            {
                error = "Invalid email or password.";
                return null;
            }

            return user;
        }

        public bool GenerateAndSend2FaCode(User user)
        {
            var code = new Random().Next(100000, 999999).ToString();
            var target = _context.Users.FirstOrDefault(u => u.Id == user.Id);
            if (target != null)
            {
                target.TwoFactorCode = code;
                target.TwoFactorExpiry = DateTime.UtcNow.AddMinutes(10);
                _context.SaveChanges();

                // Send Email asynchronously in background
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await _emailService.SendTwoFactorCodeEmailAsync(target.Email, target.Name, code);
                    }
                    catch
                    {
                        // Log locally or handle
                    }
                });
                return true;
            }
            return false;
        }

        public User? Confirm2Fa(string email, string code, out string error)
        {
            error = string.Empty;
            var user = _context.Users.FirstOrDefault(u => u.Email.ToLower() == email.ToLower());

            if (user == null)
            {
                error = "User session not found.";
                return null;
            }

            if (user.TwoFactorCode != code || user.TwoFactorExpiry == null || DateTime.UtcNow > user.TwoFactorExpiry)
            {
                error = "Invalid or expired verification code.";
                return null;
            }

            user.TwoFactorCode = null;
            user.TwoFactorExpiry = null;
            _context.SaveChanges();
            return user;
        }

        public string GenerateJwtToken(User user)
        {
            var header = new { alg = "HS256", typ = "JWT" };
            var exp = DateTimeOffset.UtcNow.AddDays(7).ToUnixTimeSeconds();
            var payload = new
            {
                nameid = user.Id,
                email = user.Email,
                unique_name = user.Name,
                company = user.Company,
                role = user.Role,
                exp = exp
            };

            var headerJson = JsonSerializer.Serialize(header);
            var payloadJson = JsonSerializer.Serialize(payload);

            var headerBase64 = Base64UrlEncode(Encoding.UTF8.GetBytes(headerJson));
            var payloadBase64 = Base64UrlEncode(Encoding.UTF8.GetBytes(payloadJson));

            var stringToSign = $"{headerBase64}.{payloadBase64}";
            var keyBytes = Encoding.UTF8.GetBytes(SecretKey);
            
            using var hmac = new HMACSHA256(keyBytes);
            var signatureBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(stringToSign));
            var signatureBase64 = Base64UrlEncode(signatureBytes);

            return $"{stringToSign}.{signatureBase64}";
        }

        public User? ValidateToken(string token)
        {
            if (string.IsNullOrWhiteSpace(token)) return null;

            try
            {
                var parts = token.Split('.');
                if (parts.Length != 3) return null;

                var headerBase64 = parts[0];
                var payloadBase64 = parts[1];
                var signatureBase64 = parts[2];

                var stringToSign = $"{headerBase64}.{payloadBase64}";
                var keyBytes = Encoding.UTF8.GetBytes(SecretKey);
                using var hmac = new HMACSHA256(keyBytes);
                var signatureBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(stringToSign));
                var expectedSignature = Base64UrlEncode(signatureBytes);

                if (signatureBase64 != expectedSignature) return null;

                var payloadJsonBytes = Base64UrlDecode(payloadBase64);
                var payloadJson = Encoding.UTF8.GetString(payloadJsonBytes);
                var payload = JsonSerializer.Deserialize<JsonElement>(payloadJson);

                var exp = payload.GetProperty("exp").GetInt64();
                var expTime = DateTimeOffset.FromUnixTimeSeconds(exp).UtcDateTime;

                if (DateTime.UtcNow > expTime) return null;

                var userId = payload.GetProperty("nameid").GetString();
                var email = payload.GetProperty("email").GetString();
                var name = payload.GetProperty("unique_name").GetString();
                var company = payload.GetProperty("company").GetString();
                var role = payload.GetProperty("role").GetString();

                if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(email)) return null;

                return new User
                {
                    Id = userId,
                    Email = email,
                    Name = name ?? string.Empty,
                    Company = company ?? string.Empty,
                    Role = role ?? "Client"
                };
            }
            catch
            {
                return null;
            }
        }

        public List<User> GetAvailableEngineers()
        {
            return _context.Users
                .Where(u => u.Role == "Engineer" && u.CurrentStatus == "Available")
                .ToList();
        }

        public bool UpdateEngineerStatus(string engineerId, string status, bool isAvailable)
        {
            var eng = _context.Users.FirstOrDefault(u => u.Id == engineerId && u.Role == "Engineer");
            if (eng != null)
            {
                eng.CurrentStatus = status;
                eng.IsAvailable = isAvailable;
                _context.SaveChanges();
                return true;
            }
            return false;
        }

        public User? AddSubPerson(string parentClientId, AddSubPersonDto dto, out string error)
        {
            error = string.Empty;

            var parent = _context.Users.FirstOrDefault(u => u.Id == parentClientId && u.Role == "Client");
            if (parent == null)
            {
                error = "Parent client account not found.";
                return null;
            }

            var count = _context.Users.Count(u => u.Role == "SubClient" && u.ParentClientId == parentClientId);
            if (count >= 5)
            {
                error = "A maximum of 5 sub-person accounts is allowed.";
                return null;
            }

            if (_context.Users.Any(u => u.Email.ToLower() == dto.Email.ToLower()))
            {
                error = "Email address is already in use.";
                return null;
            }

            var subUser = new User
            {
                Name = dto.Name,
                Email = dto.Email.ToLowerInvariant(),
                Company = parent.Company,
                PasswordHash = HashPassword(dto.Password),
                Role = "SubClient",
                ParentClientId = parentClientId
            };

            _context.Users.Add(subUser);
            _context.SaveChanges();
            return subUser;
        }

        public List<User> GetTeamMembers(string parentClientId)
        {
            return _context.Users
                .Where(u => u.Role == "SubClient" && u.ParentClientId == parentClientId)
                .ToList();
        }

        public List<User> GetAllUsers()
        {
            return _context.Users.ToList();
        }

        private static string HashPassword(string password)
        {
            var saltBytes = RandomNumberGenerator.GetBytes(16);
            using var rfc2898 = new Rfc2898DeriveBytes(password, saltBytes, 10000, HashAlgorithmName.SHA256);
            var hashBytes = rfc2898.GetBytes(32);

            var combinedBytes = new byte[48];
            Array.Copy(saltBytes, 0, combinedBytes, 0, 16);
            Array.Copy(hashBytes, 0, combinedBytes, 16, 32);

            return Convert.ToBase64String(combinedBytes);
        }

        private static bool VerifyPassword(string password, string passwordHash)
        {
            try
            {
                var combinedBytes = Convert.FromBase64String(passwordHash);
                var saltBytes = new byte[16];
                var hashBytes = new byte[32];

                Array.Copy(combinedBytes, 0, saltBytes, 0, 16);
                Array.Copy(combinedBytes, 16, hashBytes, 0, 32);

                using var rfc2898 = new Rfc2898DeriveBytes(password, saltBytes, 10000, HashAlgorithmName.SHA256);
                var checkHashBytes = rfc2898.GetBytes(32);

                return CryptographicOperations.FixedTimeEquals(hashBytes, checkHashBytes);
            }
            catch
            {
                return false;
            }
        }

        private static string Base64UrlEncode(byte[] input)
        {
            return Convert.ToBase64String(input)
                .Replace('+', '-')
                .Replace('/', '_')
                .TrimEnd('=');
        }

        private static byte[] Base64UrlDecode(string input)
        {
            var output = input.Replace('-', '+').Replace('_', '/');
            switch (output.Length % 4)
            {
                case 2: output += "=="; break;
                case 3: output += "="; break;
            }
            return Convert.FromBase64String(output);
        }
    }
}
