using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Adsp.Sdk.Access;

internal sealed class IssuerCache : IIssuerCache
{
  private readonly ILogger<IssuerCache> _logger;
  private readonly IMemoryCache _cache;
  private readonly ITenantService _tenantService;
  private readonly Uri _accessServiceUrl;

  public IssuerCache(ILogger<IssuerCache> logger, IMemoryCache cache, ITenantService tenantService, IOptions<AdspOptions> options)
  {
    if (options.Value.AccessServiceUrl == null)
    {
      throw new ArgumentException("Provided options must include value for AccessServiceUrl.", nameof(options));
    }

    _logger = logger;
    _cache = cache;
    _tenantService = tenantService;
    _accessServiceUrl = options.Value.AccessServiceUrl;
  }

  public async Task<Tenant?> GetTenantByIssuer(string issuer)
  {
    var cached = _cache.TryGetValue<Tenant>(issuer, out Tenant? tenant);
    if (!cached)
    {
      _logger.LogDebug("Cache miss for tenant of issuer: {Issuer}", issuer);

      var issuers = await RetrieveTenantIssuers();
      issuers.TryGetValue(issuer, out tenant);
    }

    return tenant;
  }

  private async Task<IDictionary<string, Tenant>> RetrieveTenantIssuers()
  {
    var tenants = await _tenantService.GetTenants();
    var issuers = tenants.ToDictionary((tenant) => new Uri(_accessServiceUrl, $"/auth/realms/{tenant.Realm}").ToString());

    foreach (var issuer in issuers)
    {
      _cache.Set(issuer.Key, issuer.Value, TimeSpan.FromHours(1));
      _logger.LogDebug("Cached issuer {Issuer} -> {Tenant} ({TenantId})", issuer.Key, issuer.Value.Name, issuer.Value.Id);
    }

    return issuers;
  }
}
