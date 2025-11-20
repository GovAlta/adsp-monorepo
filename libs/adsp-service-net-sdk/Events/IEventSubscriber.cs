
namespace Adsp.Sdk.Events;

public interface IEventSubscriber<TPayload> where TPayload : class
{
  public Task OnEvent(FullDomainEvent<TPayload> received);
}
