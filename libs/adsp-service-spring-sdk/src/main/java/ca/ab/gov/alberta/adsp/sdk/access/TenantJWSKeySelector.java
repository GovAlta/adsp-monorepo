package ca.ab.gov.alberta.adsp.sdk.access;

import java.net.MalformedURLException;
import java.security.Key;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.web.util.UriComponentsBuilder;

import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.KeySourceException;
import com.nimbusds.jose.proc.JWSAlgorithmFamilyJWSKeySelector;
import com.nimbusds.jose.proc.JWSKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.proc.JWTClaimsSetAwareJWSKeySelector;

class TenantJWSKeySelector implements JWTClaimsSetAwareJWSKeySelector<SecurityContext> {

  private final ConcurrentHashMap<String, JWSKeySelector<SecurityContext>> selectors = new ConcurrentHashMap<>();
  private final AccessIssuerCache issuerCache;

  public TenantJWSKeySelector(AccessIssuerCache issuerCache) {
    this.issuerCache = issuerCache;
  }

  @Override
  public List<? extends Key> selectKeys(JWSHeader header, JWTClaimsSet claimsSet, SecurityContext context)
      throws KeySourceException {
    var issuer = claimsSet.getIssuer();
    var cached = this.issuerCache.getCached(issuer);
    if (cached == null) {
      throw new IllegalArgumentException("Issuer not recognized");
    }

    var selector = selectors.computeIfAbsent(issuer, iss -> {
      try {
        return JWSAlgorithmFamilyJWSKeySelector
            .fromJWKSetURL(
                UriComponentsBuilder.fromUriString(issuer).path("/protocol/openid-connect/certs").build("").toURL());
      } catch (KeySourceException | MalformedURLException e) {
        return null;
      }
    });

    return selector.selectJWSKeys(header, context);
  }

}
