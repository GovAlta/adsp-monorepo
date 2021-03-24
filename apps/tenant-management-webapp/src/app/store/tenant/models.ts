export interface Tenant {
  name: string;
  isTenantAdmin?: boolean;
  isTenantCreated?: boolean;
}

export const TENANT_INIT = {
  name: '',
  isTenantAdmin: null,
  isTenantCreated: null,
};
