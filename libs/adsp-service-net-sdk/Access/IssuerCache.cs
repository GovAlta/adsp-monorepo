using Adsp.Sdk.Tenancy;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace Adsp.Sdk.Access;
internal class IssuerCache : IIssuerCache
{
  private readonly ILogger<IssuerCache> _logger;
  private readonly MemoryCache _cache = new(new MemoryCacheOptions { });
  private readonly ITenantService _tenantService;
  private readonly Uri _accessServiceUrl;

  public IssuerCache(ILogger<IssuerCache> logger, ITenantService tenantService, AdspOptions options)
  {
    if (options.AccessServiceUrl == null)
    {
      throw new ArgumentException("Provided options must include value for AccessServiceUrl.", "options");
    }

    _logger = logger;
    _tenantService = tenantService;
    _accessServiceUrl = options.AccessServiceUrl;
  }

  public async Task<Tenant?> GetTenantByIssuer(string issuer)
  {
    var cached = _cache.TryGetValue<Tenant>(issuer, out Tenant? tenant);
    if (!cached)
    {
      var issuers = await RetrieveTenantIssuers().ConfigureAwait(false);
      issuers.TryGetValue(issuer, out tenant);
    }

    return tenant;
  }

  private async Task<IDictionary<string, Tenant>> RetrieveTenantIssuers()
  {
    var tenants = await _tenantService.GetTenants().ConfigureAwait(false);
    var issuers = tenants.ToDictionary((tenant) => new Uri(_accessServiceUrl, $"/auth/realms/{tenant.Realm}").ToString());

    foreach (var issuer in issuers)
    {
      _cache.Set(issuer.Key, issuer.Value, TimeSpan.FromHours(1));
    }

    return issuers;
  }
}
