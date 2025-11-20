using Microsoft.AspNetCore.Http;

namespace Adsp.Sdk.Metrics;

internal interface IMetricsValueService
{
  Task WriteServiceMetrics(HttpContext context, IDictionary<string, decimal> metrics);
}
