package ca.ab.gov.alberta.adsp.sdk;

import ca.ab.gov.alberta.adsp.sdk.tenant.Tenant;

public interface User {
  boolean getIsCore();

  Tenant getTenant();

  String getId();

  String getName();

  String getEmail();
}
