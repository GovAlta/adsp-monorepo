package ca.ab.gov.alberta.adsp.sdk.tenant;

import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;

import ca.ab.gov.alberta.adsp.sdk.AdspConfiguration;
import ca.ab.gov.alberta.adsp.sdk.AdspId;
import ca.ab.gov.alberta.adsp.sdk.AdspRequestContextHolder;
import reactor.core.publisher.Mono;

@Order
@Component
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.REACTIVE)
class RequestedTenantWebFilter implements WebFilter {
  private final Logger logger = LoggerFactory.getLogger(RequestedTenantWebFilter.class);
  private final boolean applyFilter;

  public RequestedTenantWebFilter(AdspConfiguration configuration) {
    // No need to apply the filter if core users are not allowed or service is
    // tenant specific.
    this.applyFilter = StringUtils.isBlank(configuration.getRealm()) && configuration.getAllowCoreUser();
  }

  @Override
  public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {

    if (this.applyFilter) {
      try {
        var request = exchange.getRequest();
        var queryParams = request.getQueryParams();
        var tenantIdValues = queryParams.getOrDefault("tenantId", List.of());

        if (!tenantIdValues.isEmpty()) {
          var tenantId = AdspId.parse(tenantIdValues.get(0));
          var attributes = exchange.getAttributes();
          attributes.put(AdspRequestContextHolder.TENANT_REQUEST_ATTRIBUTE, tenantId);
        }
      } catch (Exception e) {
        this.logger.warn("Error encountered resolving requested tenant.", e);
      }
    }

    return chain.filter(exchange);
  }

}
