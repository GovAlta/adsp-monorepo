using System.Text.Json.Serialization;

namespace Adsp.Sdk.Access;

internal sealed class TokenResponse
{
  [JsonPropertyName("access_token")]
  public string? AccessToken { get; set; }

  [JsonPropertyName("expires_in")]
  public long ExpiresIn { get; set; }
}
