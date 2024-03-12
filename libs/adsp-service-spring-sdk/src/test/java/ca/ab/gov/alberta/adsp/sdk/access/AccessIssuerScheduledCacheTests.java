package ca.ab.gov.alberta.adsp.sdk.access;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

import ca.ab.gov.alberta.adsp.sdk.AdspConfiguration;
import ca.ab.gov.alberta.adsp.sdk.AdspId;
import ca.ab.gov.alberta.adsp.sdk.tenant.Tenant;
import ca.ab.gov.alberta.adsp.sdk.tenant.TenantService;
import reactor.core.publisher.Mono;

@ExtendWith(MockitoExtension.class)
class AccessIssuerScheduledCacheTests {
  @Test
  public void canGetCached(@Mock TenantService tenantService, @Mock CacheManager cacheManager,
      @Mock Cache cache) throws URISyntaxException {

    var iss = "https://access-service/auth/realms/demo";
    var tenant = new Tenant();
    tenant.setId(AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/demo"));
    tenant.setName("Demo");
    tenant.setRealm("demo");
    var tenants = new ArrayList<Tenant>();
    tenants.add(tenant);
    var issuer = new AccessIssuer(false, tenant);

    when(cacheManager.getCache("adsp.issuers")).thenReturn(cache);
    when(cache.get(iss, AccessIssuer.class)).thenReturn(issuer);
    when(tenantService.getTenants()).thenReturn(Mono.just(tenants));

    var issuerCache = new AccessIssuerScheduledCache(AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        AdspId.parse("urn:ads:platform:test-service"),
        "abc123").build(), tenantService, cacheManager);

    issuerCache.updateIssuers();
    var result = issuerCache.getCached(iss);
    assertEquals(result, issuer);
    verify(cache).put(eq(iss), any(AccessIssuer.class));
  }

  @Test
  public void canHandleMatchedTenant(@Mock TenantService tenantService, @Mock CacheManager cacheManager,
      @Mock Cache cache) throws URISyntaxException {

    var iss = "https://access-service/auth/realms/demo";
    var tenant = new Tenant();
    tenant.setId(AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/demo"));
    tenant.setName("Demo");
    tenant.setRealm("demo");
    var tenants = new ArrayList<Tenant>();
    tenants.add(tenant);
    var issuer = new AccessIssuer(false, tenant);

    when(cacheManager.getCache("adsp.issuers")).thenReturn(cache);
    when(cache.get(iss, AccessIssuer.class)).thenReturn(issuer);
    when(tenantService.getTenants()).thenReturn(Mono.just(tenants));

    var issuerCache = new AccessIssuerScheduledCache(AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        AdspId.parse("urn:ads:platform:test-service"),
        "abc123").withRealm("demo").build(), tenantService, cacheManager);

    issuerCache.updateIssuers();
    var result = issuerCache.getCached(iss);
    assertEquals(result, issuer);
    verify(cache).put(eq(iss), any(AccessIssuer.class));
  }

  @Test
  public void canHandleMismatchedTenant(@Mock TenantService tenantService, @Mock CacheManager cacheManager,
      @Mock Cache cache) throws URISyntaxException {

    var iss = "https://access-service/auth/realms/demo";
    var tenant = new Tenant();
    tenant.setId(AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/demo"));
    tenant.setName("Demo");
    tenant.setRealm("demo");
    var tenants = new ArrayList<Tenant>();
    tenants.add(tenant);

    when(cacheManager.getCache("adsp.issuers")).thenReturn(cache);
    when(cache.get(iss, AccessIssuer.class)).thenReturn(null);
    when(tenantService.getTenants()).thenReturn(Mono.just(tenants));

    var issuerCache = new AccessIssuerScheduledCache(AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        AdspId.parse("urn:ads:platform:test-service"),
        "abc123").withRealm("test").build(), tenantService, cacheManager);

    issuerCache.updateIssuers();
    var result = issuerCache.getCached(iss);
    assertNull(result);
    verify(cache, times(0)).put(eq(iss), any(AccessIssuer.class));
  }

  @Test
  public void canGetCachedCore(@Mock TenantService tenantService, @Mock CacheManager cacheManager,
      @Mock Cache cache) throws URISyntaxException {

    var iss = "https://access-service/auth/realms/core";
    var tenant = new Tenant();
    tenant.setId(AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/demo"));
    tenant.setName("Demo");
    tenant.setRealm("demo");
    var tenants = new ArrayList<Tenant>();
    tenants.add(tenant);
    var issuer = new AccessIssuer(false, tenant);

    when(cacheManager.getCache("adsp.issuers")).thenReturn(cache);
    when(cache.get(iss, AccessIssuer.class)).thenReturn(issuer);
    when(tenantService.getTenants()).thenReturn(Mono.just(tenants));

    var issuerCache = new AccessIssuerScheduledCache(AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        AdspId.parse("urn:ads:platform:test-service"),
        "abc123").allowsCoreUser(true).build(), tenantService, cacheManager);

    issuerCache.updateIssuers();
    var result = issuerCache.getCached(iss);
    assertEquals(result, issuer);
    verify(cache).put(eq(iss), any(AccessIssuer.class));
  }
}
