using System.Text.Json.Serialization;

namespace Adsp.Sdk;

public class ServiceRole
{
  [JsonPropertyName("role")]
  public string? Role { get; set; }

  [JsonPropertyName("description")]
  public string? Description { get; set; }

  [JsonPropertyName("inTenantAdmin")]
  public bool InTenantAdmin { get; set; }
}
