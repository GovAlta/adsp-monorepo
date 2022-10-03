package ca.ab.gov.alberta.adsp.sdk.events;

import reactor.core.publisher.Mono;

public interface EventService {
  <T> Mono<Void> send(DomainEvent<T> event);
}
