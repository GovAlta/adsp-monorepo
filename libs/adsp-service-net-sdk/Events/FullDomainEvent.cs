using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;

namespace Adsp.Sdk.Events;

public class FullDomainEvent<TPayload> : DomainEvent<TPayload> where TPayload : class
{
  [JsonPropertyName("tenantId")]
  public AdspId? TenantId { get; set; }

  [JsonPropertyName("namespace")]
  public string Namespace { get; set; } = "";

  [JsonConstructor]
  public FullDomainEvent() : base()
  {
  }

  internal FullDomainEvent(
    AdspId tenantId, string @namespace, string name, DateTime timestamp, TPayload payload, string? correlationId = null, IDictionary<string, object>? context = null
  ) : base(name, timestamp, payload, correlationId, context)
  {
    TenantId = tenantId;
    Namespace = @namespace;
  }
  public FullDomainEvent(string @namespace, [NotNull] DomainEvent<TPayload> @event, AdspId? tenantId = null)
    : base(@event.Name, @event.Timestamp, @event.Payload, @event.CorrelationId, @event.Context)
  {
    TenantId = tenantId;
    Namespace = @namespace;
  }
}
