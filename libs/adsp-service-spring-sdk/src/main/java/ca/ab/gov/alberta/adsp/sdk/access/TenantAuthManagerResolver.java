package ca.ab.gov.alberta.adsp.sdk.access;

import java.util.concurrent.ConcurrentHashMap;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationManagerResolver;
import org.springframework.security.oauth2.jwt.JwtDecoders;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationProvider;

import ca.ab.gov.alberta.adsp.sdk.AdspId;

class TenantAuthManagerResolver implements AuthenticationManagerResolver<String> {

  private final ConcurrentHashMap<String, JwtAuthenticationProvider> providers = new ConcurrentHashMap<>();
  private final AdspId serviceId;
  private final TenantIssuerCache issuerCache;

  public TenantAuthManagerResolver(AdspId serviceId, TenantIssuerCache issuerCache) {
    this.serviceId = serviceId;
    this.issuerCache = issuerCache;
  }

  @Override
  public AuthenticationManager resolve(String issuer) {
    var cached = this.issuerCache.getCached(issuer);
    if (cached == null) {
      // Returning null causes the framework to respond with 401.
      return null;
    }

    var provider = providers.computeIfAbsent(issuer, iss -> {
      var newProvider = new JwtAuthenticationProvider(JwtDecoders.fromIssuerLocation(iss.toString()));

      var jwtConverter = new JwtAuthenticationConverter();
      jwtConverter.setJwtGrantedAuthoritiesConverter(new AccessJwtGrantedAuthoritiesConverter(this.serviceId));
      newProvider.setJwtAuthenticationConverter(
          jwtConverter.andThen(new AccessJwtAuthenticationConverter(false, cached)));
      return newProvider;
    });

    return provider::authenticate;
  }
}
