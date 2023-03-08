package ca.ab.gov.alberta.adsp.sdk.directory;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.net.URI;
import java.net.URISyntaxException;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.http.HttpStatus;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;

import ca.ab.gov.alberta.adsp.sdk.AdspConfiguration;
import ca.ab.gov.alberta.adsp.sdk.AdspId;
import reactor.core.publisher.Mono;

@ExtendWith(MockitoExtension.class)
class DefaultServiceDirectoryTests {
  @Test
  public void canGetServiceUrl(@Mock CacheManager cacheManager, @Mock Cache cache,
      @Mock WebClient.Builder clientBuilder) throws URISyntaxException {

    var serviceId = AdspId.parse("urn:ads:platform:test-service");
    var url = new URI("https://demo-service");

    when(cacheManager.getCache("adsp.directory")).thenReturn(cache);
    when(cache.get(serviceId, URI.class)).thenReturn(null, url);
    when(clientBuilder.baseUrl(any())).thenReturn(clientBuilder);
    when(clientBuilder.build())
      .thenReturn(WebClient.builder().exchangeFunction(
        req -> Mono.just(ClientResponse.create(HttpStatus.OK)
          .header("content-type", "application/json")
          .body("[{\"urn\":\"urn:ads:platform:test-service\", \"url\":\"https://demo-service\"}]")
          .build()))
        .build());

    var directory = new DefaultServiceDirectory(AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        AdspId.parse("urn:ads:platform:test-service"),
        "abc123").build(), cacheManager, clientBuilder);

    var result = directory.getServiceUrl(serviceId).blockOptional();
    assertTrue(result.isPresent());
    assertEquals(result.get(), url);
  }

  @Test
  public void canGetServiceUrlFromCache(@Mock CacheManager cacheManager, @Mock Cache cache,
      @Mock WebClient.Builder clientBuilder) throws URISyntaxException {

    var serviceId = AdspId.parse("urn:ads:platform:test-service");
    var url = new URI("https://demo-service");

    when(cacheManager.getCache("adsp.directory")).thenReturn(cache);
    when(cache.get(serviceId, URI.class)).thenReturn(url);
    when(clientBuilder.baseUrl(any())).thenReturn(clientBuilder);
    when(clientBuilder.build()).thenReturn(WebClient.builder().build());

    var directory = new DefaultServiceDirectory(AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        AdspId.parse("urn:ads:platform:test-service"),
        "abc123").build(), cacheManager, clientBuilder);

    var result = directory.getServiceUrl(serviceId).blockOptional();
    assertTrue(result.isPresent());
    assertEquals(result.get(), url);
  }

  @Test
  public void canHandleBadUrl(@Mock CacheManager cacheManager, @Mock Cache cache,
      @Mock WebClient.Builder clientBuilder) throws URISyntaxException {

    var serviceId = AdspId.parse("urn:ads:platform:test-service");

    when(cacheManager.getCache("adsp.directory")).thenReturn(cache);
    when(cache.get(serviceId, URI.class)).thenReturn(null);
    when(clientBuilder.baseUrl(any())).thenReturn(clientBuilder);
    when(clientBuilder.build())
      .thenReturn(WebClient.builder().exchangeFunction(
        req -> Mono.just(ClientResponse.create(HttpStatus.OK)
          .header("content-type", "application/json")
          .body("[{\"urn\":\"urn:ads:platform:test-service\", \"url\":\"https://  demo-service\"}]")
          .build()))
        .build());

    var directory = new DefaultServiceDirectory(AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        AdspId.parse("urn:ads:platform:test-service"),
        "abc123").build(), cacheManager, clientBuilder);

    var result = directory.getServiceUrl(serviceId).blockOptional();
    assertFalse(result.isPresent());
  }
}
