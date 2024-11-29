using System.Text.Json.Serialization;

namespace Adsp.Platform.ScriptService.Services.Platform;

internal sealed class ValueCreateRequest
{

  [JsonPropertyName("namespace")]
  public string? Namespace { get; set; }

  [JsonPropertyName("name")]
  public string? Name { get; set; }

  [JsonPropertyName("timestamp")]
  public DateTime Timestamp { get; set; }

  [JsonPropertyName("correlationId")]
  public string? CorrelationId { get; set; }

  [JsonPropertyName("context")]
  public IDictionary<string, object?>? Context { get; set; }

  [JsonPropertyName("value")]

  public IDictionary<string, object?>? Value { get; set; }

}
