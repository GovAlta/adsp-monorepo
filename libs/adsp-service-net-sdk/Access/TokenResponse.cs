using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;

namespace Adsp.Sdk.Access;
[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "For deserialization")]
internal sealed class TokenResponse
{
  [JsonPropertyName("access_token")]
  public string? AccessToken { get; set; }

  [JsonPropertyName("expires_in")]
  public long ExpiresIn { get; set; }
}
