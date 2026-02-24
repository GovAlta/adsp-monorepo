using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Adsp.Sdk.Events;

/// <summary>
/// Hosted service that manages the lifecycle of event subscriber services.
/// This replaces EventSubscriberStartupFilter to enable proper async start/stop and graceful shutdown.
/// </summary>
internal sealed class EventSubscriberHostedService : IHostedService
{
  private readonly ILogger<EventSubscriberHostedService> _logger;
  private readonly IEnumerable<ISubscriberService> _services;

  public EventSubscriberHostedService(
    ILogger<EventSubscriberHostedService> logger,
    IEnumerable<ISubscriberService> services)
  {
    _logger = logger;
    _services = services;
  }

  public async Task StartAsync(CancellationToken cancellationToken)
  {
    _logger.LogInformation("Starting event subscriber services...");

    foreach (var service in _services)
    {
      if (cancellationToken.IsCancellationRequested)
      {
        break;
      }

      try
      {
        await service.StartAsync(cancellationToken);
      }
      catch (Exception e)
      {
        _logger.LogError(e, "Error starting subscriber service {ServiceType}.", service.GetType().Name);
      }
    }

    _logger.LogInformation("Event subscriber services started.");
  }

  public async Task StopAsync(CancellationToken cancellationToken)
  {
    _logger.LogInformation("Stopping event subscriber services...");

    foreach (var service in _services)
    {
      try
      {
        await service.StopAsync(cancellationToken);
      }
      catch (Exception e)
      {
        _logger.LogError(e, "Error stopping subscriber service {ServiceType}.", service.GetType().Name);
      }
    }

    _logger.LogInformation("Event subscriber services stopped.");
  }
}
