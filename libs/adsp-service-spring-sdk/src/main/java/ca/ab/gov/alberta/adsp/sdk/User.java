package ca.ab.gov.alberta.adsp.sdk;

import ca.ab.gov.alberta.adsp.sdk.tenant.Tenant;

/**
 * Represents the user (principal).
 */
public interface User {
  /**
   * Get a flag indicating if the user has a token issued by the core realm.
   *
   * @return
   */
  boolean isCore();

  /**
   * Gets the tenant of the user.
   *
   * @return Tenant of the user
   */
  Tenant getTenant();

  /**
   * <p>
   * Gets the ID of the user.
   * </p>
   *
   * <p>
   * This is based on the subject claim.
   * </p>
   *
   * @return ID of the user
   */
  String getId();

  /**
   * <p>
   * Gets the name of the user.
   * </p>
   *
   * <p>
   * This is based on the preferred_username claim.
   * </p>
   *
   * @returns Name of the user
   */
  String getName();

  /**
   * Gets the email of the user.
   *
   * @return Email of the user
   */
  String getEmail();

  /**
   * <p>
   * Verify if the user has a specified role.
   * </p>
   *
   * <p>
   * Role value is not expected to include the ROLE_ prefix. Roles of the current
   * service do not need to be qualified, but roles from other services must be
   * qualified with the associated service URN.
   * </p>
   *
   * <p>
   * For example -
   * 'script-runner' can be used in the service with ID
   * 'urn:ads:platform:script-service', but the fully qualified
   * 'urn:ads:platform:script-service:script-runner' value must be used in other
   * services when checking for the role.
   * </p>
   *
   * @param role Role to verify
   * @return True if the user has the role; otherwise false.
   */
  boolean isInRole(String role);
}
