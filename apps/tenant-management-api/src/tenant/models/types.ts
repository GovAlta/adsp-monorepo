export interface Tenant {
  id: string;
  /**
   * Realm associated with the tenant.
   *
   * Note: this could be the full issuer URL instead to abstract out Keycloak. i.e. other token issuers can also be
   * the basis for tenancy.
   *
   * @type {string}
   * @memberof Tenant
   */
  realm: string;
  adminEmail: string;
  name: string;
}
