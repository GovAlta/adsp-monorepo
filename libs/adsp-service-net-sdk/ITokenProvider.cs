namespace Adsp.Sdk;
/// <summary>
/// Interface the token provider that provides access tokens for making requests under a service account context.
/// </summary>
public interface ITokenProvider
{
  /// <summary>
  /// Retrieves an access token. The access token is retrieved on the service account credentials and cached until
  /// expiry.
  /// </summary>
  /// <returns>Retrieved access token</returns>
  Task<string> GetAccessToken();
}
