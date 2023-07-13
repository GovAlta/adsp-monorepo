package ca.ab.gov.alberta.adsp.sdk.registration;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.net.URI;
import java.net.URISyntaxException;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import ca.ab.gov.alberta.adsp.sdk.AdspId;
import ca.ab.gov.alberta.adsp.sdk.PlatformServices;
import ca.ab.gov.alberta.adsp.sdk.access.TokenProvider;
import ca.ab.gov.alberta.adsp.sdk.directory.ServiceDirectory;
import ca.ab.gov.alberta.adsp.sdk.events.DomainEventDefinition;
import reactor.core.publisher.Mono;

@ExtendWith(MockitoExtension.class)
class ServiceRegistrarTests {
  @Test
  public void canRegisterConfiguration(@Mock ServiceDirectory directory, @Mock TokenProvider tokenProvider,
      @Mock WebClient.Builder clientBuilder, @Mock ExchangeFunction exchangeFunction) throws URISyntaxException {

    var serviceId = AdspId.parse("urn:ads:platform:test-service");

    when(tokenProvider.getAccessToken()).thenReturn(Mono.just("token"));
    when(directory.getServiceUrl(PlatformServices.ConfigurationServiceId))
        .thenReturn(Mono.just(new URI("https://configuration-service")));
    when(clientBuilder.build())
        .thenReturn(WebClient.builder()
            .exchangeFunction(exchangeFunction)
            .build());
    when(exchangeFunction.exchange(any(ClientRequest.class)))
        .thenReturn(Mono.just(ClientResponse.create(HttpStatus.OK).build()));

    var registrar = new ServiceRegistrar(directory, tokenProvider, clientBuilder);
    registrar.register(serviceId,
        ServiceRegistration.builder().withConfiguration(new ConfigurationDefinition<String>("Test configuration") {
        }).build());

    verify(exchangeFunction, times(1)).exchange(any(ClientRequest.class));
  }

  @Test
  public void canFailRegistrationError(@Mock ServiceDirectory directory, @Mock TokenProvider tokenProvider,
      @Mock WebClient.Builder clientBuilder) throws URISyntaxException {

    var serviceId = AdspId.parse("urn:ads:platform:test-service");

    when(tokenProvider.getAccessToken()).thenReturn(Mono.just("token"));
    when(directory.getServiceUrl(PlatformServices.ConfigurationServiceId))
        .thenReturn(Mono.just(new URI("https://configuration-service")));
    when(clientBuilder.build())
        .thenReturn(WebClient.builder()
            .exchangeFunction(req -> Mono.just(ClientResponse.create(HttpStatus.BAD_GATEWAY).build()))
            .build());

    var registrar = new ServiceRegistrar(directory, tokenProvider, clientBuilder);

    Assertions.assertThrows(WebClientResponseException.class, () -> registrar.register(serviceId,
        ServiceRegistration.builder().withConfiguration(new ConfigurationDefinition<String>("Test configuration") {
        }).build()));
  }

  @Test
  public void canRegisterRoles(@Mock ServiceDirectory directory, @Mock TokenProvider tokenProvider,
      @Mock WebClient.Builder clientBuilder, @Mock ExchangeFunction exchangeFunction) throws URISyntaxException {

    var serviceId = AdspId.parse("urn:ads:platform:test-service");

    when(tokenProvider.getAccessToken()).thenReturn(Mono.just("token"));
    when(directory.getServiceUrl(PlatformServices.ConfigurationServiceId))
        .thenReturn(Mono.just(new URI("https://configuration-service")));
    when(clientBuilder.build())
        .thenReturn(WebClient.builder()
            .exchangeFunction(exchangeFunction)
            .build());
    when(exchangeFunction.exchange(any(ClientRequest.class)))
        .thenReturn(Mono.just(ClientResponse.create(HttpStatus.OK).build()));

    var registrar = new ServiceRegistrar(directory, tokenProvider, clientBuilder);
    registrar.register(serviceId,
        ServiceRegistration.builder().withRoles(new ServiceRole("tester", "Tester role")).build());

    verify(exchangeFunction, times(1)).exchange(any(ClientRequest.class));
  }

  @Test
  public void canRegisterEvents(@Mock ServiceDirectory directory, @Mock TokenProvider tokenProvider,
      @Mock WebClient.Builder clientBuilder, @Mock ExchangeFunction exchangeFunction) throws URISyntaxException {

    var serviceId = AdspId.parse("urn:ads:platform:test-service");

    when(tokenProvider.getAccessToken()).thenReturn(Mono.just("token"));
    when(directory.getServiceUrl(PlatformServices.ConfigurationServiceId))
        .thenReturn(Mono.just(new URI("https://configuration-service")));
    when(clientBuilder.build())
        .thenReturn(WebClient.builder()
            .exchangeFunction(exchangeFunction)
            .build());
    when(exchangeFunction.exchange(any(ClientRequest.class)))
        .thenReturn(Mono.just(ClientResponse.create(HttpStatus.OK).build()));

    var registrar = new ServiceRegistrar(directory, tokenProvider, clientBuilder);
    registrar.register(serviceId,
        ServiceRegistration.builder()
            .withEvents(new DomainEventDefinition<String>("test-started", "Signalled when test is started.") {
            }).build());

    verify(exchangeFunction, times(1)).exchange(any(ClientRequest.class));
  }

  @Test
  public void canRegisterFileTypes(@Mock ServiceDirectory directory, @Mock TokenProvider tokenProvider,
      @Mock WebClient.Builder clientBuilder, @Mock ExchangeFunction exchangeFunction) throws URISyntaxException {

    var serviceId = AdspId.parse("urn:ads:platform:test-service");

    when(tokenProvider.getAccessToken()).thenReturn(Mono.just("token"));
    when(directory.getServiceUrl(PlatformServices.ConfigurationServiceId))
        .thenReturn(Mono.just(new URI("https://configuration-service")));
    when(clientBuilder.build())
        .thenReturn(WebClient.builder()
            .exchangeFunction(exchangeFunction)
            .build());
    when(exchangeFunction.exchange(any(ClientRequest.class)))
        .thenReturn(Mono.just(ClientResponse.create(HttpStatus.OK).build()));

    var registrar = new ServiceRegistrar(directory, tokenProvider, clientBuilder);
    registrar.register(serviceId,
        ServiceRegistration.builder()
            .withFileTypes(new FileType("test-files", "Test files")).build());

    verify(exchangeFunction, times(1)).exchange(any(ClientRequest.class));
  }

  @Test
  public void canRegisterStreams(@Mock ServiceDirectory directory, @Mock TokenProvider tokenProvider,
      @Mock WebClient.Builder clientBuilder, @Mock ExchangeFunction exchangeFunction) throws URISyntaxException {

    var serviceId = AdspId.parse("urn:ads:platform:test-service");

    when(tokenProvider.getAccessToken()).thenReturn(Mono.just("token"));
    when(directory.getServiceUrl(PlatformServices.ConfigurationServiceId))
        .thenReturn(Mono.just(new URI("https://configuration-service")));
    when(clientBuilder.build())
        .thenReturn(WebClient.builder()
            .exchangeFunction(exchangeFunction)
            .build());
    when(exchangeFunction.exchange(any(ClientRequest.class)))
        .thenReturn(Mono.just(ClientResponse.create(HttpStatus.OK).build()));

    var registrar = new ServiceRegistrar(directory, tokenProvider, clientBuilder);
    registrar.register(serviceId,
        ServiceRegistration.builder()
            .withStreams(new StreamDefinition("test-stream", "Test stream")).build());

    verify(exchangeFunction, times(1)).exchange(any(ClientRequest.class));
  }
}
