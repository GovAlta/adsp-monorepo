using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;

namespace Adsp.Sdk.Events;

internal sealed class EventSubscriberStartupFilter : IStartupFilter
{
  private readonly IEnumerable<ISubscriberService> _services;

  public EventSubscriberStartupFilter(IEnumerable<ISubscriberService> services)
  {
    _services = services;
  }

  public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next)
  {
    return builder =>
    {
      foreach (var service in _services)
      {
        service.Connect();
      }
      next(builder);
    };
  }
}
