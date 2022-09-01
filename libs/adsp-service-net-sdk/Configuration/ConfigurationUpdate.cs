using System.Text.Json.Serialization;

namespace Adsp.Sdk.Configuration;
internal class ConfigurationUpdate
{
  [JsonPropertyName("name")]
  public string? Name { get; set; }

  [JsonPropertyName("namespace")]
  public string? Namespace { get; set; }

}
