using System.Text.Json.Serialization;

namespace Adsp.Sdk.Metadata;

internal sealed class Link
{
  [JsonPropertyName("href")]
  public Uri? Href { get; set; }
}
