package ca.ab.gov.alberta.adsp.sdk.tenant;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class TenantsResponse {
  private Tenant[] results;

  public Tenant[] getResults() {
    return results;
  }

  public void setResults(Tenant[] results) {
    this.results = results;
  }
}
