export interface Role {
  id: string;
  name: string;
}

export interface TenantBasicInfo {
  name: string;
  realm: string;
}

export interface Tenant {
  id: string;
  name: string;
  realm: string;
  adminEmail: string;
  isTenantAdmin: boolean;
  isTenantCreated: boolean;
  realmRoles: Role[];
  realmRolesFailed?: boolean;
  loginSucceeded?: boolean;
  adminInTenants: TenantBasicInfo[];
}

export const TENANT_INIT: Tenant = {
  id: '',
  name: '',
  realm: '',
  adminEmail: '',
  isTenantAdmin: null,
  isTenantCreated: null,
  realmRoles: null,
  realmRolesFailed: false,
  loginSucceeded: null,
  adminInTenants: [],
};

export const CORE_TENANT = 'Platform';
