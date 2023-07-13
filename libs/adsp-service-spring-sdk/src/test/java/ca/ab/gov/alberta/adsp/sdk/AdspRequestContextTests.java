package ca.ab.gov.alberta.adsp.sdk;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;

import ca.ab.gov.alberta.adsp.sdk.configuration.ConfigurationService;
import ca.ab.gov.alberta.adsp.sdk.tenant.Tenant;
import ca.ab.gov.alberta.adsp.sdk.tenant.TenantService;
import reactor.core.publisher.Mono;

@ExtendWith(MockitoExtension.class)
class AdspRequestContextTests {
  @Test
  public void canGetUser(@Mock TenantService tenantService, @Mock ConfigurationService configurationService,
      @Mock User user) throws URISyntaxException {

    var tenantId = AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/demo");
    var serviceId = AdspId.parse("urn:ads:platform:test-service");
    var configuration = AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        serviceId,
        "abc123").build();

    var context = new AdspRequestContext(configuration, tenantService, configurationService, user, tenantId);
    var result = context.getUser();
    assertEquals(result, user);
  }

  @Test
  public void canGetUserTenant(@Mock TenantService tenantService, @Mock ConfigurationService configurationService,
      @Mock User user) throws URISyntaxException {

    var tenantId = AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/demo");
    var requestedTenantId = AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/requested");
    var serviceId = AdspId.parse("urn:ads:platform:test-service");
    var configuration = AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        serviceId,
        "abc123").build();

    var tenant = new Tenant();
    tenant.setId(tenantId);

    when(user.isCore()).thenReturn(false);
    when(user.getTenant()).thenReturn(tenant);

    var context = new AdspRequestContext(configuration, tenantService, configurationService, user, requestedTenantId);
    var result = context.getTenant().blockOptional();
    assertTrue(result.isPresent());
    assertEquals(result.get(), tenant);
  }

  @Test
  public void canHandleNoUserInGetTenant(@Mock TenantService tenantService,
      @Mock ConfigurationService configurationService) throws URISyntaxException {

    var requestedTenantId = AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/requested");
    var serviceId = AdspId.parse("urn:ads:platform:test-service");
    var configuration = AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        serviceId,
        "abc123").build();

    var context = new AdspRequestContext(configuration, tenantService, configurationService, null, requestedTenantId);
    var result = context.getTenant().blockOptional();
    assertFalse(result.isPresent());
  }

  @Test
  public void canGetCoreUserTenant(@Mock TenantService tenantService, @Mock ConfigurationService configurationService,
      @Mock User user) throws URISyntaxException {

    var serviceId = AdspId.parse("urn:ads:platform:test-service");
    var configuration = AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        serviceId,
        "abc123").build();

    var tenant = new Tenant();

    when(user.isCore()).thenReturn(true);
    when(user.getTenant()).thenReturn(tenant);

    var context = new AdspRequestContext(configuration, tenantService, configurationService, user, null);
    var result = context.getTenant().blockOptional();
    assertTrue(result.isPresent());
    assertEquals(result.get(), tenant);
  }

  @Test
  public void canGetRequestedTenantForCoreUser(@Mock TenantService tenantService,
      @Mock ConfigurationService configurationService, @Mock User user) throws URISyntaxException {

    var tenantId = AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/requested");
    var serviceId = AdspId.parse("urn:ads:platform:test-service");
    var configuration = AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        serviceId,
        "abc123").build();

    var tenant = new Tenant();
    tenant.setId(tenantId);

    when(user.isCore()).thenReturn(true);
    when(tenantService.getTenant(tenantId)).thenReturn(Mono.just(tenant));

    var context = new AdspRequestContext(configuration, tenantService, configurationService, user, tenantId);
    var result = context.getTenant().blockOptional();
    assertTrue(result.isPresent());
    assertEquals(result.get(), tenant);
  }

  @Test
  public void canGetConfiguration(@Mock TenantService tenantService, @Mock ConfigurationService configurationService,
      @Mock User user) throws URISyntaxException {

    var tenantId = AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/demo");
    var serviceId = AdspId.parse("urn:ads:platform:test-service");
    var configuration = AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        serviceId,
        "abc123").build();

    var tenant = new Tenant();
    tenant.setId(tenantId);

    when(user.isCore()).thenReturn(false);
    when(user.getTenant()).thenReturn(tenant);
    when(configurationService.getConfiguration(eq(serviceId), eq(Optional.of(tenantId)), any()))
        .thenReturn(Mono.just("configuration123"));

    var context = new AdspRequestContext(configuration, tenantService, configurationService, user, null);
    var result = context.getConfiguration(new ParameterizedTypeReference<String>() {
    }).blockOptional();
    assertTrue(result.isPresent());
    assertEquals(result.get(), "configuration123");
  }
}
