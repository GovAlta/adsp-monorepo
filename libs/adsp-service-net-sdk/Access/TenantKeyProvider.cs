using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using RestSharp;

namespace Adsp.Sdk.Access;
internal class TenantKeyProvider : ITenantKeyProvider
{
  private ILogger<TenantKeyProvider> _logger;
  private readonly IMemoryCache _cache = new MemoryCache(new MemoryCacheOptions());
  private readonly IIssuerCache _issuerCache;
  private readonly RestClient _client;

  public TenantKeyProvider(ILogger<TenantKeyProvider> logger, IIssuerCache issuerCache, AdspOptions options)
  {
    _logger = logger;
    _issuerCache = issuerCache;
    _client = new RestClient(options.AccessServiceUrl);
  }

  public async Task<SecurityKey?> ResolveSigningKey(string issuer, string kid)
  {
    var cached = _cache.TryGetValue<SecurityKey>((issuer, kid), out SecurityKey key);
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

        if (String.Equals(issuer, metadata?.issuer))
        {
          var jwksResponse = await _client.GetAsync(new RestRequest(new Uri(metadata.jwks_uri).AbsolutePath));
          var keySet = new JsonWebKeySet(jwksResponse.Content);

          var keys = keySet.GetSigningKeys();
          foreach (var key in keys)
          {
            _cache.Set((issuer, key.KeyId), key);
            if (String.Equals(key.KeyId, kid))
            {
              result = key;
            }
          }
        }
      }
      catch (Exception e)
      {
        _logger.LogError(e, "Error encountered retrieving signing key for issuer {Issuer}.", issuer);
      }
    }

    return result;
  }
}
