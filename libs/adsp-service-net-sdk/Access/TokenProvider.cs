using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RestSharp;

namespace Adsp.Sdk.Access;

internal sealed class TokenProvider : ITokenProvider, IDisposable
{
  private readonly Lock _lock = new();
  private string? _token;
  private DateTime _expiry;

  private readonly ILogger<TokenProvider> _logger;
  private readonly Uri _authUrl;
  private readonly IRestClient _client;
  private readonly string _clientId;
  private readonly string _clientSecret;

  public TokenProvider(ILogger<TokenProvider> logger, IOptions<AdspOptions> options, IRestClient? client = null)
  {
    if (options.Value.AccessServiceUrl == null)
    {
      throw new ArgumentException("Provided options must include value for AccessServiceUrl.", nameof(options));
    }

    if (options.Value.ServiceId == null)
    {
      throw new ArgumentException("Provided options must include value for ServiceId.", nameof(options));
    }

    if (options.Value.ClientSecret == null)
    {
      throw new ArgumentException("Provided options must include value for ClientSecret.", nameof(options));
    }

    _logger = logger;
    _authUrl = new Uri(
      options.Value.AccessServiceUrl,
      $"/auth/realms/{options.Value.Realm ?? AccessConstants.CoreRealm}/protocol/openid-connect/token"
    );
    _client = client ?? new RestClient(_authUrl);
    _clientId = options.Value.ServiceId.ToString();
    _clientSecret = options.Value.ClientSecret;
  }

  private string? GetCachedToken(out DateTime expiry)
  {
    lock (_lock)
    {
      expiry = _expiry;
      return _token;
    }
  }

  private void SetCachedToken(string token, DateTime expiry)
  {
    lock (_lock)
    {
      _expiry = expiry;
      _token = token;
    }
  }

  public async Task<string> GetAccessToken()
  {
    var token = GetCachedToken(out DateTime expiry);
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
          SetCachedToken(token, DateTime.Now.AddSeconds(response.ExpiresIn - 60));

          _logger.LogDebug("Retrieved and cached access token.");
        }
      }
      catch (Exception e)
      {
        _logger.LogError(e, "Error encountered retrieving access token");
        throw;
      }

      return token!;
    }
  }

  public void Dispose()
  {
    _client.Dispose();
  }
}
