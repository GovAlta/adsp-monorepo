namespace Adsp.Sdk;
/// <summary>
/// Interface to the event service for sending domain events.
/// </summary>
public interface IEventService
{
  /// <summary>
  /// Sends a domain event to the event service.
  /// </summary>
  /// <typeparam name="TPayload">Type of the event payload.</typeparam>
  /// <param name="domainEvent">Name of the domain event to send.</param>
  /// <param name="tenantId">ID of the tenant the event is for.</param>
  Task Send<TPayload>(DomainEvent<TPayload> domainEvent, AdspId? tenantId = null) where TPayload : class;
}
