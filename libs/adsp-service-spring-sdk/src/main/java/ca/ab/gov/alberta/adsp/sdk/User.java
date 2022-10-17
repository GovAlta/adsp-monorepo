package ca.ab.gov.alberta.adsp.sdk;

import ca.ab.gov.alberta.adsp.sdk.tenant.Tenant;

public interface User {
  boolean isCore();

  Tenant getTenant();

  String getId();

  String getName();

  String getEmail();

  boolean isInRole(String role);
}
