using System.Text.Json.Serialization;

namespace Adsp.Sdk.Metadata;

internal sealed class ServiceMetadata
{
  [JsonPropertyName("name")]
  public string? Name { get; set; }

  [JsonPropertyName("description")]
  public string? Description { get; set; }

  [JsonPropertyName("_links")]
  public IDictionary<string, Link>? Links { get; set; }
}
