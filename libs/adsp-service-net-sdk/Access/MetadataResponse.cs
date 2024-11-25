using System.Text.Json.Serialization;

namespace Adsp.Sdk.Access;

internal sealed class MetadataResponse
{
  public string? Issuer { get; set; }
  [JsonPropertyName("jwks_uri")]
  public Uri? JwksUri { get; set; }
}
