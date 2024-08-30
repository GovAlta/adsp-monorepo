
using System.Diagnostics.CodeAnalysis;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RestSharp;

namespace Adsp.Sdk.Metrics;
[SuppressMessage("Usage", "CA1031: Do not catch general exception types", Justification = "WIP: script error handling")]
[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "Instantiated by dependency injection")]
internal sealed class MetricsValueService : IMetricsValueService
{
  private const int WriteDelayMs = 60000;

  private readonly ILogger<MetricsValueService> _logger;
  private readonly IServiceDirectory _directory;
  private readonly ITokenProvider _tokenProvider;
  private readonly AdspId _serviceId;
  private readonly RestClient _client;

  private readonly object _bufferLock = new();
  private readonly IList<MetricsValue> _buffer = new List<MetricsValue>();

  private CancellationTokenSource? _cancellationSource;

  public MetricsValueService(
    ILogger<MetricsValueService> logger,
    IServiceDirectory directory,
    ITokenProvider tokenProvider,
    IOptions<AdspOptions> options,
    RestClient? client = null
  )
  {
    if (options.Value.ServiceId == null)
    {
      throw new ArgumentException("Options must include value for ServiceId.");
    }

    _logger = logger;
    _directory = directory;
    _tokenProvider = tokenProvider;
    _serviceId = options.Value.ServiceId;
    _client = client ?? new RestClient();
  }

  public async Task WriteServiceMetrics(HttpContext context, IDictionary<string, decimal> values)
  {
    var tenant = await context.GetTenant();
    if (tenant?.Id != null)
    {
      var method = context.Request.Method;
      var path = context.Request.Path;

      var metrics = new Dictionary<string, decimal>
      {
        { "total:count", 1 },
        { $"{method}:{path}:count", 1 },
      };

      foreach (var value in values)
      {
        metrics.Add($"total:{value.Key}", value.Value);
        metrics.Add($"{method}:{path}:{value.Key}", value.Value);
      }

      var write = new MetricsValue
      {
        Timestamp = DateTime.Now,
        CorrelationId = $"{method}:{path}",
        TenantId = tenant.Id,
        Context = new Dictionary<string, string>
        {
          { "method", method },
          { "path", path },
          { "ip", context.Connection.RemoteIpAddress?.ToString() ?? "" },
        },
        Value = values,
        Metrics = metrics
      };

      lock (_bufferLock)
      {
        _buffer.Add(write);
      }

      _cancellationSource?.Cancel();
      var cancellationSource = new CancellationTokenSource();
      _cancellationSource = cancellationSource;

      _ = Task
        .Delay(WriteDelayMs, cancellationSource.Token)
        .ContinueWith(
          (_) => WriteMetricsValues(),
          CancellationToken.None, TaskContinuationOptions.NotOnCanceled, TaskScheduler.Default
        );
    }
  }

  private async Task WriteMetricsValues()
  {
    IList<MetricsValue> buffer;
    lock (_bufferLock)
    {
      buffer = new List<MetricsValue>(_buffer);
      _buffer.Clear();
    }

    foreach (var tenantMetrics in buffer.GroupBy(value => value.TenantId!))
    {
      try
      {
        var serviceUrl = await _directory.GetServiceUrl(AdspPlatformServices.ValueServiceId);
        var requestUrl = new Uri(serviceUrl, $"/value/v1/{_serviceId.Service}/values/{ServiceMetrics.Definition.Id}");

        var token = await _tokenProvider.GetAccessToken();
        var request = new RestRequest(requestUrl, Method.Post);
        request.AddHeader("Authorization", $"Bearer {token}");
        request.AddParameter("tenantId", tenantMetrics.Key.ToString(), ParameterType.QueryString);
        request.AddBody(tenantMetrics.ToArray());
        request.Timeout = TimeSpan.FromSeconds(30);

        await _client.PostAsync(request);

        _logger.LogDebug("Wrote service metrics to value service for tenant {Tenant}.", tenantMetrics.Key);
      }
      catch (Exception e)
      {
        _logger.LogWarning(e, "Error encountered writing service metrics for tenant {Tenant}.", tenantMetrics.Key);
      }
    }
  }
}
