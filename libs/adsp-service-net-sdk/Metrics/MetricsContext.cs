using System.Diagnostics;

namespace Adsp.Sdk.Metrics;

internal sealed class MetricsContext
{
  private const string ResponseTimeMetric = "response-time";

  private readonly Stopwatch _stopwatch = new();
  private readonly Lock _metricsLock = new();
  private readonly IDictionary<string, decimal> _metrics = new Dictionary<string, decimal>();

  public Stopwatch Stopwatch
  {
    get { return _stopwatch; }
  }

  public MetricsContext()
  {
    Stopwatch.Start();
  }

  public void RecordMetricValue(string metric, decimal value)
  {
    lock (_metricsLock)
    {
      _metrics[metric] = value;
    }
  }

  public IDisposable StartBenchmark(string metric)
  {
    return new Benchmark(this, metric);
  }

  private void RecordTimingValue(string metric, long start)
  {
    lock (_metricsLock)
    {
      _metrics.TryGetValue(metric, out decimal current);
      // Metric for the timing is the sum of individual measurements (i.e. an operation could be benchmarked multiple times.)
      _metrics[metric] = current + (Stopwatch.ElapsedMilliseconds - start);
    }
  }

  public IDictionary<string, decimal> GenerateMetrics()
  {
    _stopwatch.Stop();
    var responseTime = _stopwatch.ElapsedMilliseconds;
    RecordMetricValue(ResponseTimeMetric, responseTime);

    lock (_metricsLock)
    {
      return new Dictionary<string, decimal>(_metrics);
    }
  }

  sealed class Benchmark : IDisposable
  {
    private readonly MetricsContext _context;
    private readonly long _start;
    private readonly string _metric;

    public Benchmark(MetricsContext context, string metric)
    {
      _context = context;
      _start = context.Stopwatch.ElapsedMilliseconds;
      _metric = metric;
    }

    public void Dispose()
    {
      _context.RecordTimingValue(_metric, _start);
    }
  }
}
