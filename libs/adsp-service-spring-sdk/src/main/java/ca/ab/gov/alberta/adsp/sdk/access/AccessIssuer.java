package ca.ab.gov.alberta.adsp.sdk.access;

import ca.ab.gov.alberta.adsp.sdk.tenant.Tenant;

public final class AccessIssuer {
  private final Tenant tenant;
  private final boolean isCore;

  public Tenant getTenant() {
    return tenant;
  }

  public boolean isCore() {
    return isCore;
  }

  public AccessIssuer(boolean isCore, Tenant tenant) {
    this.tenant = tenant;
    this.isCore = isCore;
  }
}
