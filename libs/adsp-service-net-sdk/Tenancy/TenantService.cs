using Adsp.Sdk.Utils;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Polly;
using RestSharp;

namespace Adsp.Sdk.Tenancy;

internal sealed class TenantService : ITenantService, IDisposable
{
  private static readonly AdspId TENANT_SERVICE_API_ID = AdspId.Parse("urn:ads:platform:tenant-service:v2");

  private const string ContextUrlKey = "url";

  private readonly ILogger<TenantService> _logger;
  private readonly IMemoryCache _cache;
  private readonly IServiceDirectory _serviceDirectory;
  private readonly ITokenProvider _tokenProvider;
  private readonly IRestClient _client;
  private readonly AsyncPolicy _retryPolicy;

  public TenantService(
    ILogger<TenantService> logger,
    IMemoryCache cache,
    IServiceDirectory serviceDirectory,
    ITokenProvider tokenProvider,
    IRestClient? client = null
  )
  {
    _logger = logger;
    _cache = cache;
    _serviceDirectory = serviceDirectory;
    _tokenProvider = tokenProvider;
    _client = client ?? new RestClient();
    _retryPolicy = Policy.Handle<Exception>().WaitAndRetryAsync(
      10,
      retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
      (exception, timeSpan, retryCount, context) =>
      {
        _logger.LogDebug("Try {Count}: retrieving tenants from: {Url}...", retryCount, context.GetValueOrDefault(ContextUrlKey));
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

  public async Task<Tenant?> GetTenantByRealm(string realm)
  {
    // This is just by going through the collection for now, but API method is available.
    var tenants = await GetTenants();
    return tenants.FirstOrDefault((tenant) => String.Equals(realm, tenant.Realm, StringComparison.Ordinal));
  }

  public async Task<IEnumerable<Tenant>> GetTenants()
  {
    var tenants = await RetrieveTenants();
    return tenants;
  }

  private async Task<Tenant?> RetrieveTenant(AdspId tenantId)
  {
    var tenantApiUrl = await _serviceDirectory.GetServiceUrl(TENANT_SERVICE_API_ID);
    var requestUrl = new Uri(tenantApiUrl, $"v2{tenantId.Resource}").AbsoluteUri;

    var tenant = await _retryPolicy.ExecuteAsync(async (ctx) =>
    {
      var token = await _tokenProvider.GetAccessToken();
      var request = new RestRequest(requestUrl);
      request.AddHeader("Authorization", $"Bearer {token}");
      return await _client.GetAsync<Tenant>(request);
    },
      new Dictionary<string, object> { { ContextUrlKey, requestUrl } }
    );

    if (tenant != null)
    {
      _cache.Set(tenant.Id!, tenant, TimeSpan.FromHours(1));
    }

    return tenant;
  }

  private async Task<IEnumerable<Tenant>> RetrieveTenants()
  {
    var tenantApiUrl = await _serviceDirectory.GetServiceUrl(TENANT_SERVICE_API_ID);
    var requestUrl = new Uri(tenantApiUrl, "v2/tenants").AbsoluteUri;

    var tenants = await _retryPolicy.ExecuteAsync(async (ctx) =>
    {
      var token = await _tokenProvider.GetAccessToken();
      var request = new RestRequest(requestUrl);
      request.AddHeader("Authorization", $"Bearer {token}");
      var result = await _client.GetAsync<CollectionResults<Tenant>>(request);

      return result?.Results;
    },
      new Dictionary<string, object> { { ContextUrlKey, requestUrl } }
    );

    if (tenants != null)
    {
      foreach (var tenant in tenants)
      {
        _cache.Set(tenant.Id!, tenant, TimeSpan.FromHours(1));
      }
    }

    return tenants ?? Enumerable.Empty<Tenant>();
  }

  public void Dispose()
  {
    _client.Dispose();
  }
}
