package ca.ab.gov.alberta.adsp.sdk;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

import java.net.URI;
import java.net.URISyntaxException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

import ca.ab.gov.alberta.adsp.sdk.configuration.ConfigurationService;
import ca.ab.gov.alberta.adsp.sdk.tenant.TenantService;

@ExtendWith(MockitoExtension.class)
class AdspRequestContextHolderTests {
  @Mock
  private TenantService tenantService;
  @Mock
  private ConfigurationService configurationService;

  @BeforeEach
  void setUp() throws URISyntaxException {
    var serviceId = AdspId.parse("urn:ads:platform:test-service");
    var configuration = AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        serviceId,
        "abc123").build();

    AdspRequestContextHolder.setConfiguration(configuration);
    AdspRequestContextHolder.setConfigurationService(this.configurationService);
    AdspRequestContextHolder.setTenantService(this.tenantService);
  }

  @Test
  public void canGetCurrent(@Mock RequestAttributes attributes, @Mock SecurityContext securityContext,
      @Mock Authentication authentication, @Mock User user) {

    var tenantId = AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/demo");

    try (MockedStatic<RequestContextHolder> requestUtilities = Mockito.mockStatic(RequestContextHolder.class)) {
      try (MockedStatic<SecurityContextHolder> securityUtilities = Mockito.mockStatic(SecurityContextHolder.class)) {

        requestUtilities.when(RequestContextHolder::getRequestAttributes).thenReturn(attributes);
        securityUtilities.when(SecurityContextHolder::getContext).thenReturn(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(user);

        var context = AdspRequestContextHolder.current();
        assertNotNull(context);
        assertEquals(context.getUser(), user);
      }
    }
  }

  @Test
  public void canGetCurrentForCoreUser(@Mock RequestAttributes attributes, @Mock SecurityContext securityContext,
      @Mock Authentication authentication, @Mock User user) {

    var tenantId = AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/demo");

    try (MockedStatic<RequestContextHolder> requestUtilities = Mockito.mockStatic(RequestContextHolder.class)) {
      try (MockedStatic<SecurityContextHolder> securityUtilities = Mockito.mockStatic(SecurityContextHolder.class)) {

        requestUtilities.when(RequestContextHolder::getRequestAttributes).thenReturn(attributes);
        securityUtilities.when(SecurityContextHolder::getContext).thenReturn(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(user);
        when(user.isCore()).thenReturn(true);
        when(attributes.getAttribute("adsp.tenant", 0)).thenReturn(tenantId);

        var context = AdspRequestContextHolder.current();
        assertNotNull(context);
        assertEquals(context.getUser(), user);
      }
    }
  }
}
