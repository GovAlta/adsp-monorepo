package ca.ab.gov.alberta.adsp.sdk.tenant;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import ca.ab.gov.alberta.adsp.sdk.AdspId;

@JsonIgnoreProperties(ignoreUnknown = true)
public final class Tenant {
  private AdspId id;
  private String name;
  private String realm;

  public AdspId getId() {
    return id;
  }

  public void setId(AdspId id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getRealm() {
    return realm;
  }

  public void setRealm(String realm) {
    this.realm = realm;
  }
}
