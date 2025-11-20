using System.Text.Json.Serialization;

namespace Adsp.Sdk.Metrics;

internal sealed class MetricsValue
{
  [JsonPropertyName("timestamp")]
  public DateTime? Timestamp { get; set; }

  [JsonPropertyName("tenantId")]
  public AdspId? TenantId { get; set; }

  [JsonPropertyName("correlationId")]
  public string? CorrelationId { get; set; }

  [JsonPropertyName("context")]
  public IDictionary<string, string> Context { get; set; } = new Dictionary<string, string>();

  [JsonPropertyName("value")]
  public IDictionary<string, decimal> Value { get; set; } = new Dictionary<string, decimal>();

  [JsonPropertyName("metrics")]
  public IDictionary<string, decimal> Metrics { get; set; } = new Dictionary<string, decimal>();
}
