using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Polly;
using RestSharp;

namespace Adsp.Sdk.Directory;

internal sealed class ServiceDirectory : IServiceDirectory, IDisposable
{
  private readonly ILogger<ServiceDirectory> _logger;
  private readonly IMemoryCache _cache;
  private readonly IRestClient _client;
  private readonly AsyncPolicy _retryPolicy;

  public ServiceDirectory(ILogger<ServiceDirectory> logger, IMemoryCache cache, IOptions<AdspOptions> options, IRestClient? client = null
)
  {
    if (options.Value.DirectoryUrl == null)
    {
      throw new ArgumentException("Provided options must include value for DirectoryUrl.", nameof(options));
    }

    _logger = logger;
    _cache = cache;
    _client = client ?? new RestClient(options.Value.DirectoryUrl);
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
      if (!entries.TryGetValue(serviceId, out url))
      {
        throw new ArgumentException($"No service url for {serviceId}");
      }
    }

    return url!;
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
      _logger.LogDebug("Cached directory entry {Urn} -> {Url}", entry.Key, entry.Value);
    }

    return entries;
  }

  public void Dispose()
  {
    _client.Dispose();
  }
}
