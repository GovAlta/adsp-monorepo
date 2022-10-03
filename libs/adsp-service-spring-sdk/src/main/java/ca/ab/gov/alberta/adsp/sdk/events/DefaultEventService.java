package ca.ab.gov.alberta.adsp.sdk.events;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Scope;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import ca.ab.gov.alberta.adsp.sdk.AdspConfiguration;
import ca.ab.gov.alberta.adsp.sdk.AdspId;
import ca.ab.gov.alberta.adsp.sdk.PlatformServices;
import ca.ab.gov.alberta.adsp.sdk.access.TokenProvider;
import ca.ab.gov.alberta.adsp.sdk.directory.ServiceDirectory;
import reactor.core.publisher.Mono;

@Component
@Scope("singleton")
@SuppressWarnings("rawtypes")
class DefaultEventService implements EventService {

  private final Logger logger = LoggerFactory.getLogger(DefaultEventService.class);

  private final AdspId serviceId;
  private final List<String> events;
  private final ServiceDirectory directory;
  private final TokenProvider tokenProvider;
  private final WebClient client;

  public DefaultEventService(AdspConfiguration configuration, ServiceDirectory directory, TokenProvider tokenProvider,
      WebClient.Builder clientBuilder) {
    this.serviceId = configuration.getServiceId();

    List<DomainEventDefinition> registeredEvents = new ArrayList<DomainEventDefinition>();
    var registration = configuration.getRegistration();
    if (registration != null && registration.getEvents() != null) {
      registeredEvents = registration.getEvents();
    }
    this.events = registeredEvents.stream().map(definition -> definition.getName()).collect(Collectors.toList());
    this.directory = directory;
    this.tokenProvider = tokenProvider;
    this.client = clientBuilder.build();
  }

  @Override
  public <T> Mono<Void> send(DomainEvent<T> event) {

    return Mono.fromCallable(() -> {
      event.setNamespace(this.serviceId.getNamespace());
      if (!this.events.contains(event.getName())) {
        throw new IllegalArgumentException("Specified event has not been registered");
      }
      return event;
    }).flatMap(send -> Mono.zip(
        this.tokenProvider.getAccessToken(),
        this.directory.getServiceUrl(PlatformServices.EventServiceId))
        .flatMap(values -> this.client.post()
            .uri(UriComponentsBuilder.fromUri(values.getT2()).path("event/v1/events").build(""))
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + values.getT1())
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(send)
            .retrieve()
            .bodyToMono(Void.class))
        .doOnSuccess(_v -> this.logger.info("Sent domain event {}:{}"))
        .doOnError(e -> this.logger.warn("Error encountered sending event {}:{}.", e)));
  }

}
