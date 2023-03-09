package ca.ab.gov.alberta.adsp.sdk.events;

import static org.mockito.Mockito.when;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.Instant;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import ca.ab.gov.alberta.adsp.sdk.AdspConfiguration;
import ca.ab.gov.alberta.adsp.sdk.AdspId;
import ca.ab.gov.alberta.adsp.sdk.PlatformServices;
import ca.ab.gov.alberta.adsp.sdk.access.TokenProvider;
import ca.ab.gov.alberta.adsp.sdk.directory.ServiceDirectory;
import reactor.core.publisher.Mono;

@ExtendWith(MockitoExtension.class)
class DefaultEventServiceTests {
  @Test
  public void canSendEvent(@Mock ServiceDirectory directory, @Mock TokenProvider tokenProvider,
      @Mock WebClient.Builder clientBuilder) throws URISyntaxException {
    var serviceId = AdspId.parse("urn:ads:platform:test-service");

    when(tokenProvider.getAccessToken()).thenReturn(Mono.just("token"));
    when(directory.getServiceUrl(PlatformServices.EventServiceId))
        .thenReturn(Mono.just(new URI("https://event-service")));
    when(clientBuilder.build())
        .thenReturn(WebClient.builder().exchangeFunction(req -> Mono.just(ClientResponse.create(HttpStatus.OK).build()))
            .build());

    var eventService = new DefaultEventService(AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        serviceId,
        "abc123")
        .register(builder -> builder
            .withEvents(new DomainEventDefinition<String>("test-started", "Signalled when test is started") {
            }))
        .build(),
        directory, tokenProvider, clientBuilder);

    eventService.send(new DomainEvent<String>("test-started", Instant.now(), "payload")).blockOptional();
  }

  @Test
  public void canFailForUnregisteredEvent(@Mock ServiceDirectory directory, @Mock TokenProvider tokenProvider,
      @Mock WebClient.Builder clientBuilder) throws URISyntaxException {
    var serviceId = AdspId.parse("urn:ads:platform:test-service");

    var eventService = new DefaultEventService(AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        serviceId,
        "abc123")
        .register(builder -> builder.withEvents())
        .build(),
        directory, tokenProvider, clientBuilder);

    Assertions.assertThrows(IllegalArgumentException.class,
        () -> eventService.send(new DomainEvent<String>("test-started", Instant.now(), "payload")).blockOptional());
  }

  @Test
  public void canHandleNoRegistration(@Mock ServiceDirectory directory, @Mock TokenProvider tokenProvider,
      @Mock WebClient.Builder clientBuilder) throws URISyntaxException {
    var serviceId = AdspId.parse("urn:ads:platform:test-service");

    var eventService = new DefaultEventService(AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        serviceId,
        "abc123").build(),
        directory, tokenProvider, clientBuilder);

    Assertions.assertThrows(IllegalArgumentException.class,
        () -> eventService.send(new DomainEvent<String>("test-started", Instant.now(), "payload")).blockOptional());
  }

  @Test
  public void canFailForSendError(@Mock ServiceDirectory directory, @Mock TokenProvider tokenProvider,
      @Mock WebClient.Builder clientBuilder) throws URISyntaxException {
    var serviceId = AdspId.parse("urn:ads:platform:test-service");

    when(tokenProvider.getAccessToken()).thenReturn(Mono.just("token"));
    when(directory.getServiceUrl(PlatformServices.EventServiceId))
        .thenReturn(Mono.just(new URI("https://event-service")));
    when(clientBuilder.build())
        .thenReturn(WebClient.builder()
            .exchangeFunction(req -> Mono.just(ClientResponse.create(HttpStatus.BAD_GATEWAY).build()))
            .build());

    var eventService = new DefaultEventService(AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        serviceId,
        "abc123")
        .register(builder -> builder
            .withEvents(new DomainEventDefinition<String>("test-started", "Signalled when test is started") {
            }))
        .build(),
        directory, tokenProvider, clientBuilder);

    Assertions.assertThrows(WebClientResponseException.class,
        () -> eventService.send(new DomainEvent<String>("test-started", Instant.now(), "payload")).blockOptional());
  }
}
