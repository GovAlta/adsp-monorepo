package ca.ab.gov.alberta.adsp.sdk.access;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.server.resource.authentication.JwtIssuerReactiveAuthenticationManagerResolver;
import org.springframework.security.web.server.SecurityWebFilterChain;

import ca.ab.gov.alberta.adsp.sdk.AdspConfiguration;
import ca.ab.gov.alberta.adsp.sdk.AdspId;

@Configuration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.REACTIVE)
class AccessReactiveSecurityConfiguration {
  private AdspId serviceId;
  private String[] apiAntPatterns;
  private TenantIssuerCache issuerCache;

  public AccessReactiveSecurityConfiguration(AdspConfiguration configuration, TenantIssuerCache issuerCache) {
    this.serviceId = configuration.getServiceId();
    this.apiAntPatterns = configuration.getApiAntPatterns();
    this.issuerCache = issuerCache;
  }

  @Bean
  @ConditionalOnMissingBean
  SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
    var authenticationManagerResolver = new JwtIssuerReactiveAuthenticationManagerResolver(
        new TenantReactiveAuthManagerResolver(this.serviceId, this.issuerCache));

    return http
        .authorizeExchange(
            exchanges -> exchanges.pathMatchers(apiAntPatterns).authenticated())
        .oauth2ResourceServer(
            oauth2 -> oauth2.authenticationManagerResolver(authenticationManagerResolver))
        .build();
  }
}
