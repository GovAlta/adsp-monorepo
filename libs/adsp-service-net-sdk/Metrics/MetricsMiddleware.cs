using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Adsp.Sdk.Metrics;

internal sealed class MetricsMiddleware
{
  public const string BenchmarkContextKey = "ADSP:Benchmark";

  private readonly ILogger<MetricsMiddleware> _logger;
  private readonly IMetricsValueService _service;
  private readonly RequestDelegate _next;

  public MetricsMiddleware(ILogger<MetricsMiddleware> logger, IMetricsValueService service, RequestDelegate next)
  {
    _logger = logger;
    _service = service;
    _next = next;
  }

  public async Task InvokeAsync(HttpContext httpContext)
  {
    if (httpContext == null)
    {
      throw new ArgumentNullException(nameof(httpContext));
    }

    var benchmark = new MetricsContext();
    httpContext.Items.Add(BenchmarkContextKey, benchmark);

    httpContext.Response.OnStarting(() =>
    {
      var metrics = benchmark.GenerateMetrics();
      _service.WriteServiceMetrics(httpContext, metrics);
      return Task.CompletedTask;
    });

    await _next(httpContext);
  }
}
