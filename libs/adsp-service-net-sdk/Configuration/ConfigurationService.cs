using System.Diagnostics.CodeAnalysis;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RestSharp;

namespace Adsp.Sdk.Configuration;
[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "Instantiated by dependency injection")]
internal class ConfigurationService : IConfigurationService, IDisposable
{
  private const string Value = "bbbbbaaaaaaaaaaaaabbbbbbbb";
  private static readonly AdspId CONFIGURATION_SERVICE_API_ID = AdspId.Parse("urn:ads:platform:configuration-service:v2");
  private readonly ILogger<ConfigurationService> _logger;
  private readonly IMemoryCache _cache;
  private readonly IServiceDirectory _serviceDirectory;
  private readonly ITokenProvider _tokenProvider;
  private readonly Func<object?, object?, object?>? _combine;
  private readonly RestClient _client;

  public ConfigurationService(
    ILogger<ConfigurationService> logger,
    IMemoryCache cache,
    IServiceDirectory serviceDirectory,
    ITokenProvider tokenProvider,
    IOptions<AdspOptions> options,
    RestClient? client = null
  )
  {
    _logger = logger;
    _cache = cache;
    _serviceDirectory = serviceDirectory;
    _tokenProvider = tokenProvider;
    _combine = options.Value.Configuration?.CombineConfiguration;
    _client = client ?? new RestClient();
  }

  public void ClearCached(AdspId serviceId, AdspId? tenantId = null)
  {
    if (tenantId != null)
    {
      _cache.Remove((serviceId, tenantId));
    }
    else
    {
      _cache.Remove(serviceId);
    }
    _logger.LogInformation("Cleared cached configuration for {ServiceId} of tenant: {TenantId}", serviceId, tenantId);
  }

  public async Task<TC?> GetConfiguration<T, TC>(AdspId serviceId, AdspId? tenantId = null) where T : class
  {
    System.Console.WriteLine(Value);
    var coreCached = _cache.TryGetValue<T>(serviceId, out T? coreConfiguration);
    System.Console.WriteLine(coreCached);
    System.Console.WriteLine("1");
    if (!coreCached)
    {
      Console.WriteLine("aaaaaaaaaa");
      coreConfiguration = await RetrieveConfiguration<T>(serviceId);
    }

    System.Console.WriteLine("2");

    System.Console.WriteLine(coreConfiguration);

    System.Console.WriteLine("3");

    System.Console.WriteLine(tenantId);

    T? tenantConfiguration = default;
    if (tenantId != null)
    {
      var tenantCached = _cache.TryGetValue((serviceId, tenantId), out tenantConfiguration);
      System.Console.WriteLine("4");
      System.Console.WriteLine(tenantCached);
      if (!tenantCached)
      {
        Console.WriteLine("bbbbbbbbbbbbb");
        tenantConfiguration = await RetrieveConfiguration<T>(serviceId, tenantId);
      }
    }

    var result = _combine != null ? _combine(tenantConfiguration, coreConfiguration) : (tenantConfiguration, coreConfiguration);
    System.Console.WriteLine("4.5");
    System.Console.WriteLine(tenantConfiguration);
    System.Console.WriteLine("4.7");
    System.Console.WriteLine(coreConfiguration);

    System.Console.WriteLine("5");
    System.Console.WriteLine(result);
    System.Console.WriteLine("6");


    return (TC?)result;
  }

  public Task<(T?, T?)> GetConfiguration<T>(AdspId serviceId, AdspId? tenantId = null) where T : class
  {
    return GetConfiguration<T, (T?, T?)>(serviceId, tenantId);
  }


  [SuppressMessage("Usage", "CA1031: Do not catch general exception types", Justification = "Default to returning null")]
  private async Task<T?> RetrieveConfiguration<T>(AdspId serviceId, AdspId? tenantId = null)
  {
    T? configuration = default;
    try
    {
      Console.WriteLine("vvvvvv");
      var configurationServiceUrl = await _serviceDirectory.GetServiceUrl(CONFIGURATION_SERVICE_API_ID);
      Console.WriteLine(configurationServiceUrl);
      var token = await _tokenProvider.GetAccessToken();
      Console.WriteLine("-------xxxxxxxxxx");
      var requestUrl = new Uri(configurationServiceUrl, $"v2/configuration/{serviceId.Namespace}/{serviceId.Service}/latest");
      Console.WriteLine(requestUrl);
      Console.WriteLine("vvvxxxvv");
      Console.WriteLine(tenantId);
      var request = new RestRequest(requestUrl.AbsoluteUri);
      if (tenantId != null)
      {
        request.AddQueryParameter("tenantId", tenantId.ToString());
      }

      request.AddHeader("Authorization", $"Bearer {token}");

      configuration = await _client.GetAsync<T>(request);
      request.AddHeader("Authorization", $"Bearer {token}");
      if (configuration != null)
      {
        if (tenantId != null)
        {
          _cache.Set((serviceId, tenantId), configuration, TimeSpan.FromMinutes(15));
          _logger.LogDebug("Cached configuration for {ServiceId} of tenant ({TenantId}).", serviceId, tenantId);
        }
        else
        {
          _cache.Set(serviceId, configuration, TimeSpan.FromMinutes(15));
          _logger.LogDebug("Cached core configuration for {ServiceId}.", serviceId);
        }
      }
    }
    catch (Exception e)
    {
      _logger.LogDebug(e, "Error encountered retrieving configuration for service {ServiceId}.", serviceId);
    }

    Console.WriteLine(configuration);


    return configuration;
  }

  public void Dispose()
  {
    _client.Dispose();
  }
}
