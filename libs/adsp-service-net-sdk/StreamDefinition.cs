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
  public IEnumerable<EventIdentity> Events { get; set; } = Enumerable.Empty<EventIdentity>();

  public StreamDefinition(string id, string name)
  {
    Id = id;
    Name = name;
  }
}
