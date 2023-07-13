package ca.ab.gov.alberta.adsp.sdk.configuration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Optional;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.Cache.ValueWrapper;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import ca.ab.gov.alberta.adsp.sdk.AdspId;
import ca.ab.gov.alberta.adsp.sdk.PlatformServices;
import ca.ab.gov.alberta.adsp.sdk.access.TokenProvider;
import ca.ab.gov.alberta.adsp.sdk.directory.ServiceDirectory;
import reactor.core.publisher.Mono;

@ExtendWith(MockitoExtension.class)
class DefaultConfigurationServiceTests {
  @Test
  public void canGetConfiguration(@Mock CacheManager cacheManager, @Mock Cache configurationCache,
      @Mock ServiceDirectory directory, @Mock TokenProvider tokenProvider, @Mock WebClient.Builder clientBuilder)
      throws URISyntaxException {

    var serviceId = AdspId.parse("urn:ads:platform:test-service");
    var tenantId = AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/demo");

    when(cacheManager.getCache("adsp.configuration")).thenReturn(configurationCache);
    when(configurationCache.get(serviceId + "" + tenantId)).thenReturn(null);
    when(tokenProvider.getAccessToken()).thenReturn(Mono.just("token"));
    when(directory.getServiceUrl(PlatformServices.ConfigurationServiceId))
        .thenReturn(Mono.just(new URI("https://configuration-service")));
    when(clientBuilder.build())
        .thenReturn(WebClient.builder().exchangeFunction(
            req -> Mono.just(ClientResponse.create(HttpStatus.OK)
                .header("content-type", "application/json")
                .body("configuration123")
                .build()))
            .build());

    var configurationService = new DefaultConfigurationService(cacheManager, directory, tokenProvider, clientBuilder);

    var result = configurationService
        .getConfiguration(serviceId, Optional.of(tenantId), new ParameterizedTypeReference<String>() {
        }).blockOptional();

    assertTrue(result.isPresent());
    assertEquals(result.get(), "configuration123");
  }

  @Test
  public void canGetCoreConfiguration(@Mock CacheManager cacheManager, @Mock Cache configurationCache,
      @Mock ServiceDirectory directory, @Mock TokenProvider tokenProvider, @Mock WebClient.Builder clientBuilder)
      throws URISyntaxException {

    var serviceId = AdspId.parse("urn:ads:platform:test-service");

    when(cacheManager.getCache("adsp.configuration")).thenReturn(configurationCache);
    when(configurationCache.get(serviceId + "")).thenReturn(null);
    when(tokenProvider.getAccessToken()).thenReturn(Mono.just("token"));
    when(directory.getServiceUrl(PlatformServices.ConfigurationServiceId))
        .thenReturn(Mono.just(new URI("https://configuration-service")));
    when(clientBuilder.build())
        .thenReturn(WebClient.builder().exchangeFunction(
            req -> Mono.just(ClientResponse.create(HttpStatus.OK)
                .header("content-type", "application/json")
                .body("configuration123")
                .build()))
            .build());

    var configurationService = new DefaultConfigurationService(cacheManager, directory, tokenProvider, clientBuilder);

    var result = configurationService
        .getConfiguration(serviceId, Optional.empty(), new ParameterizedTypeReference<String>() {
        }).blockOptional();

    assertTrue(result.isPresent());
    assertEquals(result.get(), "configuration123");
  }

  @Test
  public void canGetConfigurationFromCache(@Mock CacheManager cacheManager, @Mock Cache configurationCache,
      @Mock ValueWrapper cachedValue, @Mock ServiceDirectory directory, @Mock TokenProvider tokenProvider,
      @Mock WebClient.Builder clientBuilder) throws URISyntaxException {

    var serviceId = AdspId.parse("urn:ads:platform:test-service");
    var tenantId = AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/demo");

    when(cacheManager.getCache("adsp.configuration")).thenReturn(configurationCache);
    when(configurationCache.get(serviceId + "" + tenantId)).thenReturn(cachedValue);
    when(cachedValue.get()).thenReturn("configuration123");
    when(tokenProvider.getAccessToken()).thenReturn(Mono.just("token"));
    when(directory.getServiceUrl(PlatformServices.ConfigurationServiceId))
        .thenReturn(Mono.just(new URI("https://configuration-service")));

    var configurationService = new DefaultConfigurationService(cacheManager, directory, tokenProvider, clientBuilder);

    var result = configurationService
        .getConfiguration(serviceId, Optional.of(tenantId), new ParameterizedTypeReference<String>() {
        }).blockOptional();

    assertTrue(result.isPresent());
    assertEquals(result.get(), "configuration123");
  }

  @Test
  public void canFailForRetrieveConfigurationError(@Mock CacheManager cacheManager, @Mock Cache configurationCache,
      @Mock ServiceDirectory directory, @Mock TokenProvider tokenProvider, @Mock WebClient.Builder clientBuilder)
      throws URISyntaxException {

    var serviceId = AdspId.parse("urn:ads:platform:test-service");
    var tenantId = AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/demo");

    when(cacheManager.getCache("adsp.configuration")).thenReturn(configurationCache);
    when(configurationCache.get(serviceId + "" + tenantId)).thenReturn(null);
    when(tokenProvider.getAccessToken()).thenReturn(Mono.just("token"));
    when(directory.getServiceUrl(PlatformServices.ConfigurationServiceId))
        .thenReturn(Mono.just(new URI("https://configuration-service")));
    when(clientBuilder.build())
        .thenReturn(WebClient.builder().exchangeFunction(
            req -> Mono.just(ClientResponse.create(HttpStatus.BAD_GATEWAY).build()))
            .build());

    var configurationService = new DefaultConfigurationService(cacheManager, directory, tokenProvider, clientBuilder);

    Assertions.assertThrows(WebClientResponseException.class,
        () -> configurationService
            .getConfiguration(serviceId, Optional.of(tenantId), new ParameterizedTypeReference<String>() {
            }).blockOptional());
  }

  @Test
  public void canClearCached(@Mock CacheManager cacheManager, @Mock Cache configurationCache,
      @Mock ServiceDirectory directory, @Mock TokenProvider tokenProvider,
      @Mock WebClient.Builder clientBuilder) {

    var serviceId = AdspId.parse("urn:ads:platform:test-service");
    var tenantId = AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/demo");

    when(cacheManager.getCache("adsp.configuration")).thenReturn(configurationCache);

    var configurationService = new DefaultConfigurationService(cacheManager, directory, tokenProvider, clientBuilder);
    configurationService.clearCached(serviceId, Optional.of(tenantId));
    verify(configurationCache).evict(serviceId + "" + tenantId);
  }

  @Test
  public void canClearAllCached(@Mock CacheManager cacheManager, @Mock Cache configurationCache,
      @Mock ServiceDirectory directory, @Mock TokenProvider tokenProvider,
      @Mock WebClient.Builder clientBuilder) {

    when(cacheManager.getCache("adsp.configuration")).thenReturn(configurationCache);

    var configurationService = new DefaultConfigurationService(cacheManager, directory, tokenProvider, clientBuilder);
    configurationService.clearCached();
    verify(configurationCache).clear();
  }
}
