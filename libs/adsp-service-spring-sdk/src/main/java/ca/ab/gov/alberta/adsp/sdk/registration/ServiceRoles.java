package ca.ab.gov.alberta.adsp.sdk.registration;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

class ServiceRoles {
  @JsonProperty
  private final List<ServiceRole> roles;

  public List<ServiceRole> getRoles() {
    return roles;
  }

  public ServiceRoles(List<ServiceRole> roles) {
    this.roles = roles;
  }
}
