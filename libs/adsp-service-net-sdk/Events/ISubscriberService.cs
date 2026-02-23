
namespace Adsp.Sdk.Events;

internal interface ISubscriberService
{
  Task StartAsync(CancellationToken cancellationToken);

  Task StopAsync(CancellationToken cancellationToken);
}
