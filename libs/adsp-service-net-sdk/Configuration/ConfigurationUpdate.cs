using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;

namespace Adsp.Sdk.Configuration;
[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "For deserialization")]
internal sealed class ConfigurationUpdate
{
  [JsonPropertyName("name")]
  public string? Name { get; set; }

  [JsonPropertyName("namespace")]
  public string? Namespace { get; set; }

}
