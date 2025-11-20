using Microsoft.AspNetCore.Http;

namespace Adsp.Sdk.Metrics;

public static class MetricsExtensions
{
  /// <summary>
  /// Benchmark timing for a metric or records a metric value.
  /// </summary>
  /// <param name="context">Context to record metrics.</param>
  /// <param name="metric">Name of the metric.</param>
  /// <returns>Benchmark state that is ended when disposed.</returns>
  /// <exception cref="ArgumentNullException">Thrown if context is null.</exception>
  public static IDisposable? Benchmark(this HttpContext context, string metric)
  {
    if (context == null)
    {
      throw new ArgumentNullException(nameof(context));
    }

    IDisposable? result = null;
    if (context.Items.TryGetValue(MetricsMiddleware.BenchmarkContextKey, out object? metricsContextValue))
    {
      MetricsContext metricsContext = (MetricsContext)metricsContextValue!;
      result = metricsContext.StartBenchmark(metric);
    }

    return result;
  }

  /// <summary>
  /// Records a metric value in the current context.
  /// </summary>
  /// <param name="context">Context to record metrics.</param>
  /// <param name="metric">Name of the metric.</param>
  /// <param name="value">Value to record.</param>
  /// <exception cref="ArgumentNullException">Thrown if context is null.</exception>
  public static void RecordMetric(this HttpContext context, string metric, decimal value)
  {
    if (context == null)
    {
      throw new ArgumentNullException(nameof(context));
    }

    if (context.Items.TryGetValue(MetricsMiddleware.BenchmarkContextKey, out object? metricsContextValue))
    {
      MetricsContext metricsContext = (MetricsContext)metricsContextValue!;
      metricsContext.RecordMetricValue(metric, value);
    }
  }
}
