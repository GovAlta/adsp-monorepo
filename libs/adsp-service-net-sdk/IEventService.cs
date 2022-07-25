namespace Adsp.Sdk;
public interface IEventService
{
  Task Send<TPayload>(DomainEvent<TPayload> domainEvent, AdspId? tenantId = null) where TPayload : class;
}
