package ca.ab.gov.alberta.adsp.sdk.access;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
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

import ca.ab.gov.alberta.adsp.sdk.AdspConfiguration;
import ca.ab.gov.alberta.adsp.sdk.AdspId;
import reactor.core.publisher.Mono;

@ExtendWith(MockitoExtension.class)
class ServiceAccountTokenProviderTests {
  @Test
  public void canGetAccessToken(@Mock WebClient.Builder clientBuilder) throws URISyntaxException {

    when(clientBuilder.build())
        .thenReturn(WebClient.builder().exchangeFunction(
            req -> Mono.just(ClientResponse.create(HttpStatus.OK)
                .header("content-type", "application/json")
                .body("{\"access_token\":\"token\",\"expires_in\":300}")
                .build()))
            .build());

    var tokenProvider = new ServiceAccountTokenProvider(AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        AdspId.parse("urn:ads:platform:test-service"),
        "abc123").build(), clientBuilder);

    var token = tokenProvider.getAccessToken().blockOptional();

    assertTrue(token.isPresent());
    assertEquals(token.get(), "token");
  }

  @Test
  public void canGetAccessTokenFromCache(@Mock WebClient.Builder clientBuilder, @Mock ExchangeFunction exchangeFunction) throws URISyntaxException {

    when(clientBuilder.build())
        .thenReturn(WebClient.builder().exchangeFunction(exchangeFunction).build());
    when(exchangeFunction.exchange(any(ClientRequest.class)))
        .thenReturn(Mono.just(ClientResponse.create(HttpStatus.OK)
            .header("content-type", "application/json")
            .body("{\"access_token\":\"token\",\"expires_in\":300}")
            .build()));

    var tokenProvider = new ServiceAccountTokenProvider(AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        AdspId.parse("urn:ads:platform:test-service"),
        "abc123").build(), clientBuilder);

    tokenProvider.getAccessToken().blockOptional();
    var token = tokenProvider.getAccessToken().blockOptional();

    assertTrue(token.isPresent());
    assertEquals(token.get(), "token");
    verify(exchangeFunction, times(1)).exchange(any(ClientRequest.class));
  }

  @Test
  public void canGetAccessTokenForExpiredToken(@Mock WebClient.Builder clientBuilder, @Mock ExchangeFunction exchangeFunction) throws URISyntaxException {

    when(clientBuilder.build())
        .thenReturn(WebClient.builder().exchangeFunction(exchangeFunction).build());
    when(exchangeFunction.exchange(any(ClientRequest.class)))
        .thenReturn(Mono.just(ClientResponse.create(HttpStatus.OK)
            .header("content-type", "application/json")
            .body("{\"access_token\":\"token\",\"expires_in\":0}")
            .build()),
            Mono.just(ClientResponse.create(HttpStatus.OK)
            .header("content-type", "application/json")
            .body("{\"access_token\":\"token\",\"expires_in\":300}")
            .build()));

    var tokenProvider = new ServiceAccountTokenProvider(AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        AdspId.parse("urn:ads:platform:test-service"),
        "abc123").build(), clientBuilder);

    tokenProvider.getAccessToken().blockOptional();
    var token = tokenProvider.getAccessToken().blockOptional();

    assertTrue(token.isPresent());
    assertEquals(token.get(), "token");
    verify(exchangeFunction, times(2)).exchange(any(ClientRequest.class));
  }

  @Test
  public void canFailForGetAccessTokenError(@Mock WebClient.Builder clientBuilder) throws URISyntaxException {

    when(clientBuilder.build())
        .thenReturn(WebClient.builder().exchangeFunction(
            req -> Mono.just(ClientResponse.create(HttpStatus.BAD_GATEWAY).build()))
            .build());

    var tokenProvider = new ServiceAccountTokenProvider(AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        AdspId.parse("urn:ads:platform:test-service"),
        "abc123").build(), clientBuilder);

    Assertions.assertThrows(WebClientResponseException.class, () -> tokenProvider.getAccessToken().blockOptional());
  }

  @Test
  public void canFailForNoToken(@Mock WebClient.Builder clientBuilder) throws URISyntaxException {

    when(clientBuilder.build())
        .thenReturn(WebClient.builder().exchangeFunction(
            req -> Mono.just(ClientResponse.create(HttpStatus.OK)
                .header("content-type", "application/json").body("{}").build()))
            .build());

    var tokenProvider = new ServiceAccountTokenProvider(AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        AdspId.parse("urn:ads:platform:test-service"),
        "abc123").build(), clientBuilder);

    Assertions.assertThrows(RuntimeException.class, () -> tokenProvider.getAccessToken().blockOptional());
  }
}
