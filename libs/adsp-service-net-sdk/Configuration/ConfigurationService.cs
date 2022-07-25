using System.Diagnostics.CodeAnalysis;
using Adsp.Sdk.Access;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using RestSharp;

namespace Adsp.Sdk.Configuration;
internal class ConfigurationService : IConfigurationService
{
  private static readonly AdspId CONFIGURATION_SERVICE_API_ID = AdspId.Parse("urn:ads:platform:configuration-service:v2");
  private readonly ILogger<ConfigurationService> _logger;
  private readonly IMemoryCache _cache = new MemoryCache(new MemoryCacheOptions { });
  private readonly IServiceDirectory _serviceDirectory;
  private readonly ITokenProvider _tokenProvider;
  private readonly AdspId _serviceId;
  private readonly Func<object?, object?, object?>? _combine;
  private readonly RestClient _client;

  public ConfigurationService(ILogger<ConfigurationService> logger, IServiceDirectory serviceDirectory, ITokenProvider tokenProvider, AdspOptions options)
  {
    if (options?.ServiceId == null)
    {
      throw new ArgumentException("Provided options must include a value for ServiceId.");
    }

    _logger = logger;
    _serviceDirectory = serviceDirectory;
    _tokenProvider = tokenProvider;
    _serviceId = options.ServiceId;
    _combine = options.Configuration?.CombineConfiguration;
    _client = new RestClient();
  }

  public async Task<TC?> GetConfiguration<T, TC>(AdspId? tenantId = null) where T : class
  {
    var coreCached = _cache.TryGetValue<T>(_serviceId, out T? coreConfiguration);
    if (!coreCached)
    {
      coreConfiguration = await RetrieveConfiguration<T>();
    }

    T? tenantConfiguration = default;
    if (tenantId != null)
    {
      var tenantCached = _cache.TryGetValue((_serviceId, tenantId), out tenantConfiguration);
      if (!tenantCached)
      {
        tenantConfiguration = await RetrieveConfiguration<T>(tenantId);
      }
    }

    var result = _combine != null ? _combine(tenantConfiguration, coreConfiguration) : (tenantConfiguration, coreConfiguration);
    return (TC?)result;
  }

  public Task<(T?, T?)> GetConfiguration<T>(AdspId? tenantId = null) where T : class
  {
    return GetConfiguration<T, (T?, T?)>(tenantId);
  }


  [SuppressMessage("Usage", "CA1031: Do not catch general exception types", Justification = "Default to returning null")]
  private async Task<T?> RetrieveConfiguration<T>(AdspId? tenantId = null)
  {
    T? configuration = default;
    try
    {
      var configurationServiceUrl = await _serviceDirectory.GetServiceUrl(CONFIGURATION_SERVICE_API_ID);
      var token = await _tokenProvider.GetAccessToken();

      var requestUrl = new Uri(configurationServiceUrl, $"v2/configuration/{_serviceId.Namespace}/{_serviceId.Service}/latest");
      var request = new RestRequest(requestUrl.AbsoluteUri);
      if (tenantId != null)
      {
        request.AddQueryParameter("tenantId", tenantId.ToString());
      }

      request.AddHeader("Authorization", $"Bearer {token}");

      configuration = await _client.GetAsync<T>(request);
      if (configuration != null)
      {
        if (tenantId != null)
        {
          _cache.Set((_serviceId, tenantId), configuration, TimeSpan.FromMinutes(15));
        }
        else
        {
          _cache.Set(_serviceId, configuration, TimeSpan.FromMinutes(15));
        }
      }
    }
    catch (Exception e)
    {
      _logger.LogDebug(e, "Error encountered retrieving configuration for service {ServiceId}.", _serviceId);
    }

    return configuration;
  }
}
