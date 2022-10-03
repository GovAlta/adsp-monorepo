package ca.ab.gov.alberta.adsp.sdk.access;

import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import ca.ab.gov.alberta.adsp.sdk.User;
import ca.ab.gov.alberta.adsp.sdk.tenant.Tenant;

final class AdspUser implements User {

  private final boolean isCore;
  private final Tenant tenant;
  private final String id;
  private final String name;
  private final String email;
  private final JwtAuthenticationToken authentication;

  @Override
  public boolean getIsCore() {
    return isCore;
  }

  @Override
  public Tenant getTenant() {
    return tenant;
  }

  @Override
  public String getId() {
    return id;
  }

  @Override
  public String getName() {
    return name;
  }

  @Override
  public String getEmail() {
    return email;
  }

  public AdspUser(boolean isCore, Tenant tenant, String id, String name, String email,
      JwtAuthenticationToken authentication) {
    this.isCore = isCore;
    this.tenant = tenant;
    this.id = id;
    this.name = name;
    this.email = email;
    this.authentication = authentication;
  }

  public boolean IsInRole(String role) {
    return this.authentication.getAuthorities()
        .stream()
        .anyMatch(authority -> authority.getAuthority()
            .equals(AccessJwtGrantedAuthoritiesConverter.ROLE_AUTHORITY_PREFIX + role));
  }
}
