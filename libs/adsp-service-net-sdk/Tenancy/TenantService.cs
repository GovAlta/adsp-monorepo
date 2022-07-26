using System.Diagnostics.CodeAnalysis;
using Adsp.Sdk.Utils;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Polly;
using RestSharp;

namespace Adsp.Sdk.Tenancy;
[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "Instantiated by dependency injection")]
internal class TenantService : ITenantService
{
  private static readonly AdspId TENANT_SERVICE_API_ID = AdspId.Parse("urn:ads:platform:tenant-service:v2");
  private readonly ILogger<TenantService> _logger;
  private readonly IMemoryCache _cache = new MemoryCache(new MemoryCacheOptions { });
  private readonly IServiceDirectory _serviceDirectory;
  private readonly ITokenProvider _tokenProvider;
  private readonly RestClient _client;
  private readonly AsyncPolicy _retryPolicy;

  public TenantService(ILogger<TenantService> logger, IServiceDirectory serviceDirectory, ITokenProvider tokenProvider)
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
      tenant = await RetrieveTenant(tenantId);
    }

    return tenant;
  }

  public async Task<IList<Tenant>> GetTenants()
  {
    var tenants = await RetrieveTenants();
    return tenants;
  }

  private async Task<Tenant?> RetrieveTenant(AdspId tenantId)
  {
    var tenant = await _retryPolicy.ExecuteAsync(async () =>
      {
        var token = await _tokenProvider.GetAccessToken();
        return await _client.GetAsync<Tenant>(new RestRequest(tenantId.Resource));
      }
    );

    if (tenant != null)
    {
      _cache.Set(tenant.Id, tenant, TimeSpan.FromHours(1));
    }

    return tenant;
  }

  private async Task<IList<Tenant>> RetrieveTenants()
  {
    var tenantApiUrl = await _serviceDirectory.GetServiceUrl(TENANT_SERVICE_API_ID);
    var requestUrl = new Uri(tenantApiUrl, "v2/tenants").AbsoluteUri;

    var tenants = await _retryPolicy.ExecuteAsync(async () =>
      {
        var token = await _tokenProvider.GetAccessToken();
        var request = new RestRequest(requestUrl);
        request.AddHeader("Authorization", $"Bearer {token}");
        var result = await _client.GetAsync<CollectionResults<Tenant>>(request);

        return result?.Results;
      }
    );

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
