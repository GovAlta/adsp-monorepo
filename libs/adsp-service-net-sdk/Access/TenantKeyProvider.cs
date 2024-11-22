using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using RestSharp;

namespace Adsp.Sdk.Access;

internal sealed class TenantKeyProvider : ITenantKeyProvider, IDisposable
{
  private readonly ILogger<TenantKeyProvider> _logger;
  private readonly IMemoryCache _cache;
  private readonly IIssuerCache _issuerCache;
  private readonly IRestClient _client;

  public TenantKeyProvider(ILogger<TenantKeyProvider> logger, IMemoryCache cache, IIssuerCache issuerCache, IOptions<AdspOptions> options, IRestClient? client = null)
  {
    if (options.Value.AccessServiceUrl == null)
    {
      throw new ArgumentException("Provided options must include value for AccessServiceUrl", nameof(options));
    }

    _logger = logger;
    _cache = cache;
    _issuerCache = issuerCache;
    _client = client ?? new RestClient(options.Value.AccessServiceUrl);
  }

  public async Task<SecurityKey?> ResolveSigningKey(string issuer, string kid)
  {
    var cached = _cache.TryGetValue((issuer, kid), out SecurityKey? key);
    if (!cached)
    {
      key = await RetrieveSigningKey(issuer, kid);
    }

    return key;
  }

  public async Task<SecurityKey?> RetrieveSigningKey(string issuer, string kid)
  {
    SecurityKey? result = null;
    var tenant = await _issuerCache.GetTenantByIssuer(issuer);

    if (tenant != null)
    {
      try
      {
        var metadata = await _client.GetAsync<MetadataResponse>(
          new RestRequest($"/auth/realms/{tenant.Realm}/.well-known/openid-configuration")
        );

        if (metadata != null && String.Equals(issuer, metadata.Issuer, StringComparison.Ordinal) && metadata.JwksUri != null)
        {
          var jwksResponse = await _client.GetAsync(new RestRequest(metadata.JwksUri.AbsolutePath));
          var keySet = new JsonWebKeySet(jwksResponse.Content);

          var keys = keySet.GetSigningKeys();
          foreach (var key in keys)
          {
            _cache.Set((issuer, key.KeyId), key);
            if (String.Equals(key.KeyId, kid, StringComparison.Ordinal))
            {
              result = key;
            }

            _logger.LogDebug("Cached key {Kid} of issuer: {Issuer}", key.KeyId, issuer);
          }
        }
      }
      catch (HttpRequestException e)
      {
        _logger.LogError(e, "Error encountered retrieving signing key for issuer {Issuer}.", issuer);
      }
    }

    return result;
  }

  public void Dispose()
  {
    _client.Dispose();
  }
}
