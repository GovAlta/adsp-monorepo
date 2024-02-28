package ca.ab.gov.alberta.adsp.sdk.access;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManagerResolver;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtIssuerAuthenticationManagerResolver;
import org.springframework.security.web.SecurityFilterChain;

import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import com.nimbusds.jwt.proc.JWTProcessor;

import ca.ab.gov.alberta.adsp.sdk.AdspConfiguration;
import ca.ab.gov.alberta.adsp.sdk.AdspId;
import ca.ab.gov.alberta.adsp.sdk.metadata.ApiDocsMetadata;

@Configuration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
public class AccessSecurityConfiguration {

  private final AdspId serviceId;
  private final String[] apiAntPatterns;
  private final AccessIssuerCache issuerCache;

  @Autowired(required = false)
  private ApiDocsMetadata docsMetadata;

  public AccessSecurityConfiguration(AdspConfiguration configuration, AccessIssuerCache issuerCache) {
    this.serviceId = configuration.getServiceId();
    this.apiAntPatterns = configuration.getApiAntPatterns();
    this.issuerCache = issuerCache;
  }

  @Bean
  @ConditionalOnMissingBean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    var authenticationManagerResolver = new JwtIssuerAuthenticationManagerResolver(
        new TenantAuthManagerResolver(this.serviceId, this.issuerCache));

    return configureHttpSecurity(http, authenticationManagerResolver)
        .build();
  }

  protected HttpSecurity configureHttpSecurity(HttpSecurity http,
      AuthenticationManagerResolver<HttpServletRequest> authenticationManagerResolver) throws Exception {

    return http
        .authorizeHttpRequests(
            authorize -> {
              if (this.docsMetadata != null) {
                authorize = authorize.antMatchers(HttpMethod.GET, this.docsMetadata.getOpenApiPath()).permitAll();
              }
              authorize.antMatchers(this.apiAntPatterns).authenticated();
            })
        .oauth2ResourceServer(
            oauth2 -> oauth2.authenticationManagerResolver(authenticationManagerResolver));
  }

  @Bean
  @ConditionalOnMissingBean
  public JWTProcessor<SecurityContext> jwtProcessor() {
    var jwtProcessor = new DefaultJWTProcessor<SecurityContext>();
    jwtProcessor.setJWTClaimsSetAwareJWSKeySelector(new TenantJWSKeySelector(this.issuerCache));
    return jwtProcessor;
  }

  @Bean
  @ConditionalOnMissingBean
  public JwtDecoder jwtDecoder(JWTProcessor<SecurityContext> jwtProcessor) {
    var decoder = new NimbusJwtDecoder(jwtProcessor);
    var validator = new DelegatingOAuth2TokenValidator<>(JwtValidators.createDefault(),
        new TenantTokenValidator(this.issuerCache));
    decoder.setJwtValidator(validator);
    return decoder;
  }
}
