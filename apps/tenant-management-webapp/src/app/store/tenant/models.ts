export interface Role {
  id: string;
  name: string;
}
export interface Tenant {
  id: string;
  name: string;
  realm: string;
  isTenantAdmin: boolean;
  isTenantCreated: boolean;
  realmRoles: Role[];
}

export const TENANT_INIT: Tenant = {
  id: '',
  name: '',
  realm: '',
  isTenantAdmin: null,
  isTenantCreated: null,
  realmRoles: null,
};
