
namespace Adsp.Sdk;

public class ServiceMetrics : ValueDefinition<IDictionary<string, decimal>>
{
  public static readonly ValueDefinition Definition = new ServiceMetrics();

  public ServiceMetrics() :
    base("service-metrics", "Service metrics", "Low level metrics of the service.")
  {
  }
}
