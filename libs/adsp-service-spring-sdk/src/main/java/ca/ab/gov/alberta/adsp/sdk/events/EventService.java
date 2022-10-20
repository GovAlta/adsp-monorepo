package ca.ab.gov.alberta.adsp.sdk.events;

import reactor.core.publisher.Mono;

/**
 * Interface to an event service for sending domain events.
 */
public interface EventService {
  /**
   * Send a domain event
   * 
   * @param <T>   Type of event payload
   * @param event Domain event to send
   * @return Mono of Void
   */
  <T> Mono<Void> send(DomainEvent<T> event);
}
