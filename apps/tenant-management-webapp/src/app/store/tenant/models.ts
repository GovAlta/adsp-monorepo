export interface Role {
  id: string;
  name: string;
}
export interface Tenant {
  id: string;
  name: string;
  realm: string;
  adminEmail: string;
  isTenantAdmin: boolean;
  hasAdminRole: boolean;
  isTenantCreated: boolean;
  realmRoles: Role[];
}

export const TENANT_INIT: Tenant = {
  id: '',
  name: '',
  realm: '',
  adminEmail: '',
  isTenantAdmin: null,
  hasAdminRole: null,
  isTenantCreated: null,
  realmRoles: null,
};
