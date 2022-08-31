using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;
using Adsp.Sdk.Amqp;

namespace Adsp.Sdk;
public class EventIdentity
{
  [JsonPropertyName("namespace")]
  public string Namespace { get; private set; }

  [JsonPropertyName("name")]
  public string Name { get; private set; }

  [JsonPropertyName("criteria")]
  public EventIdentityCriteria? Criteria { get; set; }

  public EventIdentity(string @namespace, string name)
  {
    Namespace = @namespace;
    Name = name;
  }
}

[SuppressMessage("Usage", "CA2227: Collection properties should be read only", Justification = "Data transfer object")]
public class EventIdentityCriteria
{
  [JsonPropertyName("correlationId")]
  public string? CorrelationId { get; set; }

  [JsonPropertyName("context")]
  public IDictionary<string, object>? Context { get; set; }
}
