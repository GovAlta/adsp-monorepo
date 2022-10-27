package ca.ab.gov.alberta.adsp.sdk.registration;

import org.springframework.util.Assert;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonInclude.Include;

/**
 * Service role representing a domain specific role associated privileges in the
 * service
 */
@JsonInclude(value = Include.NON_NULL)
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

  /**
   * Create an instance of service role.
   *
   * @param role          Name of the role
   * @param description   Description of the role
   * @param inTenantAdmin Flag indicating if the role is part of the tenant admin
   *                      composite role
   */
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
