package ca.ab.gov.alberta.adsp.sdk.access;

import java.util.concurrent.ConcurrentHashMap;

import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.authentication.ReactiveAuthenticationManagerResolver;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoders;
import org.springframework.security.oauth2.server.resource.authentication.JwtReactiveAuthenticationManager;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverter;

import ca.ab.gov.alberta.adsp.sdk.AdspId;
import ca.ab.gov.alberta.adsp.sdk.tenant.Tenant;
import reactor.core.publisher.Mono;

class TenantReactiveAuthManagerResolver implements ReactiveAuthenticationManagerResolver<String> {

  private final ConcurrentHashMap<String, JwtReactiveAuthenticationManager> managers = new ConcurrentHashMap<>();
  private final AdspId serviceId;
  private final TenantIssuerCache issuerCache;

  public TenantReactiveAuthManagerResolver(AdspId serviceId, TenantIssuerCache issuerCache) {
    this.serviceId = serviceId;
    this.issuerCache = issuerCache;
  }

  @Override
  public Mono<ReactiveAuthenticationManager> resolve(String issuer) {
    Tenant cached = this.issuerCache.getCached(issuer);
    if (cached == null) {
      throw new IllegalArgumentException("Issuer not recognized");
    }

    var manager = managers.computeIfAbsent(issuer, iss -> {
      var decoder = ReactiveJwtDecoders.fromIssuerLocation(issuer);
      var newManager = new JwtReactiveAuthenticationManager(decoder);

      var jwtConverter = new ReactiveJwtAuthenticationConverter();
      jwtConverter
          .setJwtGrantedAuthoritiesConverter(new AccessJwtGrantedAuthoritiesConverter(this.serviceId).asReactive());
      newManager.setJwtAuthenticationConverter(
          jwtConverter.andThen(new AccessJwtAuthenticationConverter(false, cached).asReactive()));
      return newManager;
    });

    return Mono.just(manager);
  }
}
