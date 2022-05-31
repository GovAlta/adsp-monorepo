export interface User {
  id: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  emailVerified: boolean;
  email: string;
  requiredActions: string[];
  access: {
    [key: string]: boolean;
  };
}

export interface Role {
  id: string;
  clientRole: boolean;
  description: string;
  name: string;
  userIds: string[];
}

export interface AccessState {
  metrics: {
    users: number;
    activeUsers: number;
  };
  users: Record<string, User>;
  roles: Record<string, Role>;
}

export const ACCESS_INIT: AccessState = {
  metrics: {
    users: null,
    activeUsers: null,
  },
  users: {},
  roles: null,
};

export interface ServiceRoleState {
  tenant: ServiceRoles;
  core: ServiceRoles;
}

export type ServiceRoles = ServiceRole[];

export const SERVICE_ROLES_INIT: ServiceRoleState = {
  tenant: null,
  core: null,
};

export interface ServiceRole {
  role: string;
  description: string;
  inTenantAdmin?: boolean;
}

export interface ConfigServiceRole {
  roles?: ServiceRoles;
}
export type ServiceRoleConfig = Record<string, ConfigServiceRole>;
