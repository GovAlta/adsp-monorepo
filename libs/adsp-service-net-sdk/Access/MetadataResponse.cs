using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;

namespace Adsp.Sdk.Access;
[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "For deserialization")]
internal sealed class MetadataResponse
{
  public string? Issuer { get; set; }
  [JsonPropertyName("jwks_uri")]
  public Uri? JwksUri { get; set; }
}
