using System.Text.Json.Serialization;

namespace Adsp.Sdk.Event;
internal class EventRequestBody<TPayload> where TPayload : class
{
  [JsonPropertyName("tenantId")]
  public string? TenantId { get; set; }

  [JsonPropertyName("namespace")]
  public string Namespace { get; set; }

  [JsonPropertyName("name")]
  public string Name { get; set; }

  [JsonPropertyName("timestamp")]
  public DateTime Timestamp { get; set; }

  [JsonPropertyName("correlationId")]
  public string? CorrelationId { get; set; }

  [JsonPropertyName("payload")]
  public TPayload Payload { get; set; }

  public EventRequestBody(string @namespace, DomainEvent<TPayload> @event, AdspId? tenantId = null)
  {
    TenantId = tenantId?.ToString();
    Namespace = @namespace;
    Name = @event.Name;
    Timestamp = @event.Timestamp;
    CorrelationId = @event.CorrelationId;
    Payload = @event.Payload;
  }
}
