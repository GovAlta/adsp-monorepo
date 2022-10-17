package ca.ab.gov.alberta.adsp.sdk.access;

import java.util.concurrent.ConcurrentHashMap;

import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;

class TenantTokenValidator implements OAuth2TokenValidator<Jwt> {

  private final ConcurrentHashMap<String, JwtIssuerValidator> validators = new ConcurrentHashMap<>();
  private final AccessIssuerCache issuerCache;

  public TenantTokenValidator(AccessIssuerCache issuerCache) {
    this.issuerCache = issuerCache;
  }

  @Override
  public OAuth2TokenValidatorResult validate(Jwt token) {
    String issuer = token.getIssuer().toString();
    var cached = this.issuerCache.getCached(issuer);
    if (cached == null) {
      throw new IllegalArgumentException("Issuer not recognized");
    }

    var validator = this.validators.computeIfAbsent(issuer, iss -> new JwtIssuerValidator(issuer.toString()));

    return validator.validate(token);
  }
}
