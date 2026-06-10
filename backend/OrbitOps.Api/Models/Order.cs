using System;
using System.Collections.Generic;

namespace OrbitOps.Api.Models
{
    public class HandoverHistoryEntry
    {
        public string PreviousEngineer { get; set; } = string.Empty;
        public string NewEngineer { get; set; } = string.Empty;
        public string ProgressSummary { get; set; } = string.Empty;
        public string StatusAtHandover { get; set; } = string.Empty;
        public DateTime HandoverDate { get; set; } = DateTime.UtcNow;
        public string AdminUserId { get; set; } = string.Empty;
    }

    public class Order
    {
        public string Id { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string WorkflowType { get; set; } = string.Empty;
        public string SourceSystem { get; set; } = string.Empty;
        public string DestinationSystem { get; set; } = string.Empty;
        public Dictionary<string, string> SourceCredentials { get; set; } = new();
        public Dictionary<string, string> DestinationCredentials { get; set; } = new();
        public decimal Price { get; set; }
        public string Instructions { get; set; } = string.Empty;
        public string EngineerName { get; set; } = string.Empty;
        public double EngineerRating { get; set; }
        public string Status { get; set; } = "Awaiting Assignment";
        public string EstimatedCompletionTime { get; set; } = "Awaiting Review";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public List<HandoverHistoryEntry> HandoverHistory { get; set; } = new();

        [System.ComponentModel.DataAnnotations.Schema.NotMapped]
        public string ClientName { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.Schema.NotMapped]
        public string ClientCompany { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.Schema.NotMapped]
        public string ClientEmail { get; set; } = string.Empty;
    }
}
