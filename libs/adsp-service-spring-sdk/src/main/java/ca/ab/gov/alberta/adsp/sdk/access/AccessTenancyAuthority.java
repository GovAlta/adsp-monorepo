package ca.ab.gov.alberta.adsp.sdk.access;

import org.springframework.security.core.GrantedAuthority;

class AccessTenancyAuthority implements GrantedAuthority {

  private final String authority;

  public AccessTenancyAuthority(AccessIssuer issuer) {
    if (issuer.isCore()) {
      this.authority = AccessConstants.CoreCrossTenantAuthority;
    } else {
      this.authority = AccessConstants.TenantAuthorityPrefix + issuer.getTenant().getRealm();
    }
  }

  @Override
  public String getAuthority() {
    return this.authority;
  }

}
