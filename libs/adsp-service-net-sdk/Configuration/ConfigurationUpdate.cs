using System.Text.Json.Serialization;

namespace Adsp.Sdk.Configuration;
internal class ConfigurationUpdatePayload
{
  [JsonPropertyName("name")]
  public string? Name { get; set; }

  [JsonPropertyName("namespace")]
  public string? Namespace { get; set; }

}

internal class ConfigurationUpdate
{
  [JsonPropertyName("tenantId")]
  public AdspId? TenantId { get; set; }

  [JsonPropertyName("payload")]
  public ConfigurationUpdatePayload? Payload { get; set; }
}
