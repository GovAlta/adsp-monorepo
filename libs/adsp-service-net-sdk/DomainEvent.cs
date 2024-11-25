using System.Text.Json.Serialization;
using Adsp.Sdk.Util;

namespace Adsp.Sdk;

public class DomainEvent<TPayload> where TPayload : class
{
  [JsonPropertyName("name")]
  public string Name { get; set; } = "";

  [JsonPropertyName("timestamp")]
  public DateTime Timestamp { get; set; }

  [JsonPropertyName("correlationId")]
  public string? CorrelationId { get; set; }

  [JsonPropertyName("context")]
  [JsonConverter(typeof(DictionaryJsonConverter))]
#pragma warning disable CA2227 // Collection properties should be read only
  public IDictionary<string, object>? Context { get; set; }
#pragma warning restore CA2227 // Collection properties should be read only

  [JsonPropertyName("payload")]
  public TPayload? Payload { get; set; }

  [JsonConstructor]
  public DomainEvent()
  {
  }

  public DomainEvent(string name, DateTime timestamp, TPayload? payload, string? correlationId = null, IDictionary<string, object>? context = null)
  {
    Name = name;
    Timestamp = timestamp;
    CorrelationId = correlationId;
    Payload = payload;
    Context = context;
  }
}
