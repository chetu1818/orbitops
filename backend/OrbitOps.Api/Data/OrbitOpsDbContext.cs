using Microsoft.EntityFrameworkCore;
using OrbitOps.Api.Models;
using System.Collections.Generic;
using System.Text.Json;

namespace OrbitOps.Api.Data
{
    public class OrbitOpsDbContext : DbContext
    {
        public OrbitOpsDbContext(DbContextOptions<OrbitOpsDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<ChatSession> ChatSessions { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.Id);
            });

            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasKey(o => o.Id);
                entity.Property(o => o.SourceCredentials)
                    .HasConversion(
                        v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                        v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, (JsonSerializerOptions)null) ?? new Dictionary<string, string>()
                    );
                entity.Property(o => o.DestinationCredentials)
                    .HasConversion(
                        v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                        v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, (JsonSerializerOptions)null) ?? new Dictionary<string, string>()
                    );
            });

            modelBuilder.Entity<ChatSession>(entity =>
            {
                entity.HasKey(c => c.Id);
                entity.Property(c => c.ParticipantIds)
                    .HasConversion(
                        v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                        v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions)null) ?? new List<string>()
                    );
                entity.HasMany(c => c.Messages)
                    .WithOne()
                    .HasForeignKey("ChatSessionId")
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ChatMessage>(entity =>
            {
                entity.HasKey(m => m.Id);
            });
        }
    }
}
