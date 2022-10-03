package ca.ab.gov.alberta.adsp.sdk.access;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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

@Configuration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
class AccessSecurityConfiguration {

  private final AdspId serviceId;
  private final String[] apiAntPatterns;
  private final TenantIssuerCache issuerCache;

  public AccessSecurityConfiguration(AdspConfiguration configuration, TenantIssuerCache issuerCache) {
    this.serviceId = configuration.getServiceId();
    this.apiAntPatterns = configuration.getApiAntPatterns();
    this.issuerCache = issuerCache;
  }

  @Bean
  @ConditionalOnMissingBean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    var authenticationManagerResolver = new JwtIssuerAuthenticationManagerResolver(
        new TenantAuthManagerResolver(this.serviceId, this.issuerCache));

    return http
        .authorizeHttpRequests(
            authorize -> authorize.antMatchers(this.apiAntPatterns).authenticated())
        .oauth2ResourceServer(
            oauth2 -> oauth2.authenticationManagerResolver(authenticationManagerResolver))
        .build();
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
