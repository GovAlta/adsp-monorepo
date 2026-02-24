
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Adsp.Sdk.Events;

internal static class EventExtensions
{
  internal static bool ContainsService<T, TImplementation>(this IServiceCollection services)
  {
    return services.FirstOrDefault(
      service => service.ServiceType == typeof(T) && service.ImplementationType == typeof(TImplementation)
    ) != null;
  }

  internal static IServiceCollection TryAddSubscriberServices(this IServiceCollection services)
  {
    if (!services.ContainsService<IHostedService, EventSubscriberHostedService>())
    {
      services.AddSingleton<IHostedService, EventSubscriberHostedService>();
    }

    return services;
  }
}
