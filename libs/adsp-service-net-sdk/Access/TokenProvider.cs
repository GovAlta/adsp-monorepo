using System.Diagnostics.CodeAnalysis;
using Microsoft.Extensions.Logging;
using RestSharp;

namespace Adsp.Sdk.Access;
[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "Instantiated by dependency injection")]
internal class TokenProvider : ITokenProvider
{
  private readonly object _lock = new object();
  private string? _token;
  private DateTime _expiry;

  private readonly ILogger<TokenProvider> _logger;
  private readonly Uri _authUrl;
  private readonly RestClient _client;
  private readonly string _clientId;
  private readonly string _clientSecret;

  public TokenProvider(ILogger<TokenProvider> logger, AdspOptions options)
  {
    if (options.AccessServiceUrl == null)
    {
      throw new ArgumentException("Provided options must include value for AccessServiceUrl.", nameof(options));
    }

    if (options.ServiceId == null)
    {
      throw new ArgumentException("Provided options must include value for ServiceId.", nameof(options));
    }

    if (options.ClientSecret == null)
    {
      throw new ArgumentException("Provided options must include value for ClientSecret.", nameof(options));
    }

    _logger = logger;
    _authUrl = new Uri(options.AccessServiceUrl, $"/auth/realms/{options.Realm}/protocol/openid-connect/token");
    _client = new RestClient(_authUrl);
    _clientId = options.ServiceId.ToString();
    _clientSecret = options.ClientSecret;
  }

  private string? getCachedToken(out DateTime expiry)
  {
    lock (_lock)
    {
      expiry = _expiry;
      return _token;
    }
  }

  private void setCachedToken(string token, DateTime expiry)
  {
    lock (_lock)
    {
      _expiry = expiry;
      _token = token;
    }
  }

  public async Task<string> GetAccessToken()
  {
    var token = getCachedToken(out DateTime expiry);
    if (!String.IsNullOrEmpty(token) && DateTime.Now < expiry)
    {
      _logger.LogDebug("Using existing access token...");
      return token;
    }
    else
    {
      _logger.LogDebug("Requesting access token from {AuthUrl}...", _authUrl);

      try
      {
        var request = new RestRequest("", Method.Post)
          .AddParameter("grant_type", "client_credentials")
          .AddParameter("client_id", _clientId, ParameterType.GetOrPost)
          .AddParameter("client_secret", _clientSecret, ParameterType.GetOrPost);

        var response = await _client.PostAsync<TokenResponse>(request);
        if (!String.IsNullOrEmpty(response?.AccessToken))
        {
          token = response.AccessToken;
          setCachedToken(token, DateTime.Now.AddSeconds(response.ExpiresIn - 60));

          _logger.LogDebug("Retrieved and cached access token.");
        }
      }
      catch (Exception e)
      {
        _logger.LogError(e, "Error encountered retrieving access token");
        throw;
      }

      return token;
    }
  }
}
