package ca.ab.gov.alberta.adsp.sdk.access;

import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

class AccessJwtAuthenticationToken extends JwtAuthenticationToken {

  private final AdspUser user;

  public AccessJwtAuthenticationToken(JwtAuthenticationToken token, AdspUser user) {
    super(token.getToken(), token.getAuthorities());
    this.user = user;
  }

  @Override
  public Object getPrincipal() {
    return this.user;
  }
}
