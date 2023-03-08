package ca.ab.gov.alberta.adsp.sdk.tenant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
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

import ca.ab.gov.alberta.adsp.sdk.AdspId;
import ca.ab.gov.alberta.adsp.sdk.access.TokenProvider;
import ca.ab.gov.alberta.adsp.sdk.directory.ServiceDirectory;
import reactor.core.publisher.Mono;

@ExtendWith(MockitoExtension.class)
class DefaultTenantServiceTests {
  @Test
  public void canBeInitialized(@Mock CacheManager cacheManager, @Mock ServiceDirectory directory,
      @Mock TokenProvider tokenProvider, @Mock WebClient.Builder clientBuilder) {
    var tenantService = new DefaultTenantService(cacheManager, directory, tokenProvider, clientBuilder);
    assertNotNull(tenantService);
  }

  @Test
  public void canGetTenants(@Mock CacheManager cacheManager, @Mock Cache tenantCache, @Mock ServiceDirectory directory,
      @Mock TokenProvider tokenProvider, @Mock WebClient.Builder clientBuilder) throws URISyntaxException {

    when(cacheManager.getCache(anyString())).thenReturn(tenantCache);
    when(tokenProvider.getAccessToken()).thenReturn(Mono.just("token"));
    when(directory.getServiceUrl(any())).thenReturn(Mono.just(new URI("https://tenant-service/v1")));
    when(clientBuilder.build())
      .thenReturn(WebClient.builder().exchangeFunction(
        req -> Mono.just(ClientResponse.create(HttpStatus.OK)
          .header("content-type", "application/json")
          .body("{\"results\":[{\"id\":\"urn:ads:platform:tenant-service:v2:/tenants/demo\",\"name\":\"demo\",\"realm\":\"demo\"}]}")
          .build())
      ).build());

    var tenantService = new DefaultTenantService(cacheManager, directory, tokenProvider, clientBuilder);
    var result = tenantService.getTenants().blockOptional();
    assertTrue(result.isPresent());
    assertEquals(result.get().size(), 1);

    var tenant = result.get().get(0);
    assertNotNull(tenant.getId());
    assertEquals(tenant.getName(), "demo");
    assertEquals(tenant.getRealm(), "demo");

    verify(tenantCache, times(1)).put(tenant.getId(), tenant);
  }

  @Test
  public void canGetTenant(@Mock CacheManager cacheManager, @Mock Cache tenantCache, @Mock ServiceDirectory directory,
      @Mock TokenProvider tokenProvider, @Mock WebClient.Builder clientBuilder) throws URISyntaxException {

    when(cacheManager.getCache(anyString())).thenReturn(tenantCache);
    when(tokenProvider.getAccessToken()).thenReturn(Mono.just("token"));
    when(directory.getServiceUrl(any())).thenReturn(Mono.just(new URI("https://tenant-service/v1")));
    when(clientBuilder.build())
      .thenReturn(WebClient.builder().exchangeFunction(
        req -> Mono.just(ClientResponse.create(HttpStatus.OK)
          .header("content-type", "application/json")
          .body("{\"results\":[{\"id\":\"urn:ads:platform:tenant-service:v2:/tenants/demo\",\"name\":\"demo\",\"realm\":\"demo\"}]}")
          .build())
      ).build());


      var tenantId = AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/demo");
      var tenant = new Tenant();
      tenant.setId(tenantId);
      tenant.setName("demo");
      tenant.setRealm("demo");

      when(tenantCache.get(tenantId, Tenant.class)).thenReturn(null, tenant);

    var tenantService = new DefaultTenantService(cacheManager, directory, tokenProvider, clientBuilder);
    var result = tenantService.getTenant(tenantId).blockOptional();
    assertTrue(result.isPresent());
    assertEquals(result.get().getId(), tenantId);
    assertEquals(result.get().getName(), "demo");
    assertEquals(result.get().getRealm(), "demo");
  }

  @Test
  public void canGetTenantFromCache(@Mock CacheManager cacheManager, @Mock Cache tenantCache, @Mock ServiceDirectory directory,
      @Mock TokenProvider tokenProvider, @Mock WebClient.Builder clientBuilder) throws URISyntaxException {

    when(cacheManager.getCache(anyString())).thenReturn(tenantCache);
    when(tokenProvider.getAccessToken()).thenReturn(Mono.just("token"));
    when(directory.getServiceUrl(any())).thenReturn(Mono.just(new URI("https://tenant-service/v1")));

    var tenantId = AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/demo");
    var tenant = new Tenant();
    tenant.setId(tenantId);
    tenant.setName("demo");
    tenant.setRealm("demo");

    when(tenantCache.get(tenantId, Tenant.class)).thenReturn(tenant);

    var tenantService = new DefaultTenantService(cacheManager, directory, tokenProvider, clientBuilder);
    var result = tenantService.getTenant(tenantId).blockOptional();
    assertTrue(result.isPresent());
    assertEquals(result.get().getId(), tenantId);
    assertEquals(result.get().getName(), "demo");
    assertEquals(result.get().getRealm(), "demo");
  }
}
