using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;

namespace Adsp.Sdk;
public class StreamDefinition
{
  [JsonPropertyName("id")]
  public string Id { get; private set; }

  [JsonPropertyName("name")]
  public string Name { get; private set; }

  [JsonPropertyName("description")]
  public string? Description { get; set; }

  [JsonPropertyName("publicSubscribe")]
  public bool PublicSubscribe { get; set; }

  [JsonPropertyName("subscriberRoles")]
  public IEnumerable<string> SubscriberRoles { get; set; } = Enumerable.Empty<string>();

  [JsonPropertyName("events")]
  public IEnumerable<StreamEvent> Events { get; set; } = Enumerable.Empty<StreamEvent>();

  public StreamDefinition(string id, string name)
  {
    Id = id;
    Name = name;
  }
}

public class StreamEvent
{
  [JsonPropertyName("namespace")]
  public string Namespace { get; private set; }

  [JsonPropertyName("name")]
  public string Name { get; private set; }

  [JsonPropertyName("criteria")]
  public StreamEventCriteria? Criteria { get; set; }

  public StreamEvent(string @namespace, string name)
  {
    Namespace = @namespace;
    Name = name;
  }
}

[SuppressMessage("Usage", "CA2227: Collection properties should be read only", Justification = "Data transfer object")]
public class StreamEventCriteria
{
  [JsonPropertyName("correlationId")]
  public string? CorrelationId { get; set; }

  [JsonPropertyName("context")]
  public IDictionary<string, object>? Context { get; set; }
}
