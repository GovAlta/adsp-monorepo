package ca.ab.gov.alberta.adsp.sdk.tenant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import ca.ab.gov.alberta.adsp.sdk.AdspConfiguration;
import ca.ab.gov.alberta.adsp.sdk.AdspId;
import ca.ab.gov.alberta.adsp.sdk.AdspRequestContextHolder;

@ExtendWith(MockitoExtension.class)
class RequestedTenantFilterTests {
  @Test
  public void canAddRequestAttribute(@Mock HttpServletRequest request, @Mock ServletResponse response,
      @Mock FilterChain chain) throws URISyntaxException, IOException, ServletException {

    var tenantId = AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/demo");
    when(request.getParameter("tenantId")).thenReturn(tenantId.toString());

    var filter = new RequestedTenantFilter(AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        AdspId.parse("urn:ads:platform:test-service"),
        "abc123").allowsCoreUser(true).build());

    filter.doFilter(request, response, chain);

    verify(request).setAttribute(AdspRequestContextHolder.TENANT_REQUEST_ATTRIBUTE, tenantId);
  }

  @Test
  public void canSkipApplyForTenantService(@Mock HttpServletRequest request, @Mock ServletResponse response,
      @Mock FilterChain chain) throws URISyntaxException, IOException, ServletException {

    var filter = new RequestedTenantFilter(AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        AdspId.parse("urn:ads:platform:test-service"),
        "abc123").withRealm("demo").build());

    filter.doFilter(request, response, chain);

    verify(request, never()).setAttribute(any(), any());
  }

  @Test
  public void canSkipApplyForCoreUserNotAllowed(@Mock HttpServletRequest request, @Mock ServletResponse response,
      @Mock FilterChain chain) throws URISyntaxException, IOException, ServletException {

    var filter = new RequestedTenantFilter(AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        AdspId.parse("urn:ads:platform:test-service"),
        "abc123").allowsCoreUser(false).build());

    filter.doFilter(request, response, chain);

    verify(request, never()).setAttribute(any(), any());
  }
}
