package ca.ab.gov.alberta.adsp.sdk.access;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.ReactiveAuthenticationManagerResolver;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.server.resource.authentication.JwtIssuerReactiveAuthenticationManagerResolver;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.server.ServerWebExchange;

import ca.ab.gov.alberta.adsp.sdk.AdspConfiguration;
import ca.ab.gov.alberta.adsp.sdk.AdspId;
import ca.ab.gov.alberta.adsp.sdk.metadata.ApiDocsMetadata;

@Configuration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.REACTIVE)
public class AccessReactiveSecurityConfiguration {
  private AdspId serviceId;
  private String[] apiAntPatterns;
  private AccessIssuerCache issuerCache;

  @Autowired(required = false)
  private ApiDocsMetadata docsMetadata;

  public AccessReactiveSecurityConfiguration(AdspConfiguration configuration, AccessIssuerCache issuerCache) {
    this.serviceId = configuration.getServiceId();
    this.apiAntPatterns = configuration.getApiAntPatterns();
    this.issuerCache = issuerCache;
  }

  @Bean
  @ConditionalOnMissingBean
  SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
    var authenticationManagerResolver = new JwtIssuerReactiveAuthenticationManagerResolver(
        new TenantReactiveAuthManagerResolver(this.serviceId, this.issuerCache));

    return configureServerHttpSecurity(http, authenticationManagerResolver).build();
  }

  protected ServerHttpSecurity configureServerHttpSecurity(ServerHttpSecurity http,
      ReactiveAuthenticationManagerResolver<ServerWebExchange> authenticationManagerResolver) {

    return http
        .authorizeExchange(
            exchanges -> {
              if (this.docsMetadata != null) {
                exchanges = exchanges.pathMatchers(HttpMethod.GET, this.docsMetadata.getOpenApiPath()).permitAll();
              }
              exchanges.pathMatchers(apiAntPatterns).authenticated()
                  .anyExchange().permitAll();
            })
        .oauth2ResourceServer(
            oauth2 -> oauth2.authenticationManagerResolver(authenticationManagerResolver));
  }
}
