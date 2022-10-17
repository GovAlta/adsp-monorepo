package ca.ab.gov.alberta.adsp.sdk.tenant;

import java.io.IOException;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import ca.ab.gov.alberta.adsp.sdk.AdspConfiguration;
import ca.ab.gov.alberta.adsp.sdk.AdspId;
import ca.ab.gov.alberta.adsp.sdk.AdspRequestContextHolder;

@Order
@Component
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
class RequestedTenantFilter implements Filter {
  private final Logger logger = LoggerFactory.getLogger(RequestedTenantFilter.class);
  private final boolean applyFilter;

  public RequestedTenantFilter(AdspConfiguration configuration) {
    // No need to apply the filter if core users are not allowed or service is
    // tenant specific.
    this.applyFilter = StringUtils.isBlank(configuration.getRealm()) && configuration.getAllowCoreUser();
  }

  @Override
  public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
      throws IOException, ServletException {

    if (this.applyFilter) {
      try {
        var req = (HttpServletRequest) request;
        // NOTE: This is not just query parameter; it can be part of form post as well.
        var tenantIdValue = req.getParameter("tenantId");
        if (StringUtils.isNotEmpty(tenantIdValue)) {
          req.setAttribute(AdspRequestContextHolder.TENANT_REQUEST_ATTRIBUTE, AdspId.parse(tenantIdValue));
        }
      } catch (Exception e) {
        this.logger.warn("Error encountered resolving requested tenant.", e);
      }
    }

    chain.doFilter(request, response);
  }
}
