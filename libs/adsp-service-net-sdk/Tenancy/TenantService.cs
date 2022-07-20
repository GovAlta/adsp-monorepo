using Adsp.Sdk.Access;
using Adsp.Sdk.Directory;
using Adsp.Sdk.Utils;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Polly;
using RestSharp;

namespace Adsp.Sdk.Tenancy;
internal class TenantService : ITenantService
{
  private readonly ILogger<TenantService> _logger;
  private readonly MemoryCache _cache = new MemoryCache(new MemoryCacheOptions { });
  private readonly IServiceDirectory _serviceDirectory;
  private readonly ITokenProvider _tokenProvider;
  private readonly RestClient _client;
  private readonly AsyncPolicy _retryPolicy;

  public TenantService(ILogger<TenantService> logger, IServiceDirectory serviceDirectory, ITokenProvider tokenProvider, AdspOptions options)
  {
    _logger = logger;
    _serviceDirectory = serviceDirectory;
    _tokenProvider = tokenProvider;
    _client = new RestClient();
    _retryPolicy = Policy.Handle<Exception>().WaitAndRetryAsync(
      10,
      retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
      (exception, timeSpan, retryCount, context) =>
      {
        _logger.LogDebug("Try {Count}: retrieving tenants...", retryCount);
      }
    );
  }

  public async Task<Tenant?> GetTenant(AdspId tenantId)
  {
    var cached = _cache.TryGetValue<Tenant>(tenantId, out Tenant? tenant);
    if (!cached)
    {
      tenant = await RetrieveTenant(tenantId).ConfigureAwait(false);
    }

    return tenant;
  }

  public async Task<IList<Tenant>> GetTenants()
  {
    var tenants = await RetrieveTenants().ConfigureAwait(false);
    return tenants;
  }

  private async Task<Tenant?> RetrieveTenant(AdspId tenantId)
  {
    var tenant = await _retryPolicy.ExecuteAsync(async () =>
      {
        var token = await _tokenProvider.GetAccessToken().ConfigureAwait(false);
        return await _client.GetAsync<Tenant>(new RestRequest(tenantId.Resource)).ConfigureAwait(false);
      }
    ).ConfigureAwait(false);

    if (tenant != null)
    {
      _cache.Set(tenant.Id, tenant, TimeSpan.FromHours(1));
    }

    return tenant;
  }

  private async Task<IList<Tenant>> RetrieveTenants()
  {
    var tenantApiUrl = await _serviceDirectory.GetServiceUrl(AdspId.Parse("urn:ads:platform:tenant-service:v2")).ConfigureAwait(false);
    var requestUrl = new Uri(tenantApiUrl, "v2/tenants").AbsoluteUri;

    var tenants = await _retryPolicy.ExecuteAsync(async () =>
      {
        var token = await _tokenProvider.GetAccessToken().ConfigureAwait(false);
        var request = new RestRequest(requestUrl);
        request.AddHeader("Authorization", $"Bearer {token}");
        var result = await _client.GetAsync<CollectionResults<Tenant>>(request).ConfigureAwait(false);

        return result?.Results;
      }
    ).ConfigureAwait(false);

    if (tenants != null)
    {
      foreach (var tenant in tenants)
      {
        _cache.Set(tenant.Id, tenant, TimeSpan.FromHours(1));
      }
    }

    return tenants != null ? tenants : new List<Tenant>();
  }
}
