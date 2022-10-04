package ca.ab.gov.alberta.adsp.sdk.registration;

import org.springframework.util.Assert;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ServiceRole {
  @JsonProperty
  private final String role;
  @JsonProperty
  private final String description;
  @JsonProperty
  private final boolean inTenantAdmin;

  public String getRole() {
    return role;
  }

  public String getDescription() {
    return description;
  }

  public boolean getInTenantAdmin() {
    return inTenantAdmin;
  }

  public ServiceRole(String role, String description, boolean inTenantAdmin) {
    Assert.hasLength(role, "role cannot be null or empty.");

    this.role = role;
    this.description = description;
    this.inTenantAdmin = inTenantAdmin;
  }

  public ServiceRole(String role, String description) {
    this(role, description, false);
  }
}
