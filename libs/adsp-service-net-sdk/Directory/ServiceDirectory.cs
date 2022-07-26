using System.Diagnostics.CodeAnalysis;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Polly;
using RestSharp;

namespace Adsp.Sdk.Directory;
[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "Instantiated by dependency injection")]
internal class ServiceDirectory : IServiceDirectory
{
  private readonly ILogger<ServiceDirectory> _logger;
  private readonly IMemoryCache _cache = new MemoryCache(new MemoryCacheOptions { });
  private readonly RestClient _client;
  private readonly AsyncPolicy _retryPolicy;

  public ServiceDirectory(ILogger<ServiceDirectory> logger, AdspOptions options)
  {
    if (options.DirectoryUrl == null)
    {
      throw new ArgumentException("Provided options must include value for DirectoryUrl.", nameof(options));
    }

    _logger = logger;
    _client = new RestClient(options.DirectoryUrl);
    _retryPolicy = Policy.Handle<Exception>().WaitAndRetryAsync(
      10,
      retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
      (exception, timeSpan, retryCount, context) =>
      {
        _logger.LogDebug("Try {Count}: retrieving directory...", retryCount);
      }
    );
  }

  public async Task<Uri> GetServiceUrl(AdspId serviceId)
  {
    var cached = _cache.TryGetValue<Uri>(serviceId, out Uri? url);
    if (!cached)
    {
      var entries = await RetrieveDirectory(serviceId.Namespace);
      url = entries[serviceId];
    }

    return url;
  }

  private async Task<IDictionary<AdspId, Uri>> RetrieveDirectory(string @namespace)
  {
    var entries = await _retryPolicy.ExecuteAsync(async () =>
      {
        var entries = new Dictionary<AdspId, Uri>();
        var results = await _client.GetAsync<DirectoryEntry[]>(new RestRequest($"/directory/v2/namespaces/{@namespace}/entries"));
        if (results != null)
        {
          foreach (var result in results)
          {
            if (result?.Url != null)
            {
              entries[AdspId.Parse(result.Urn)] = result.Url;
            }
          }
        }

        return entries;
      }
    );

    foreach (var entry in entries)
    {
      _cache.Set(entry.Key, entry.Value, TimeSpan.FromHours(1));
    }

    return entries;
  }
}
