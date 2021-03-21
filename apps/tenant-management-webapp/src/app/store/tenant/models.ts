export interface Tenant {
  name: string;
  isTenantAdmin: boolean;
  isTenantCreated: boolean;
}

export const TENANT_INIT: Tenant = {
  name: '',
  isTenantAdmin: false,
  isTenantCreated: false,
};
