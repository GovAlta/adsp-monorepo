export interface Tenant {
  name: string;
  realm: string;
  isTenantAdmin: boolean;
  isTenantCreated: boolean;
}

export const TENANT_INIT: Tenant = {
  name: '',
  realm: '',
  isTenantAdmin: null,
  isTenantCreated: null,
};
