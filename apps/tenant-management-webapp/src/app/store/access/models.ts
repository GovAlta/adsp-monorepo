import { v4 as uuidv4 } from 'uuid';

export const TENANT_SERVICE_CLIENT_URN = 'urn:ads:platform:tenant-service';
export const TENANT_ADMIN_ROLE = 'tenant-admin';

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
  tenant?: ServiceRoleConfig;
  core?: ServiceRoleConfig;
  keycloak?: ServiceRoleConfig;
  keycloakIdMap?: Record<string, string>;
}

export type ServiceRoles = ServiceRole[];

export const SERVICE_ROLES_INIT: ServiceRoleState = {
  tenant: null,
  core: null,
  keycloak: null,
  keycloakIdMap: null,
};

export interface ServiceRole {
  role: string;
  description: string;
  inTenantAdmin?: boolean;
}

export interface ConfigServiceRole {
  roles?: ServiceRoles;
}

export interface KeycloakClientRole {
  name: string;
  description: string;
  isComposite?: boolean;
}

export interface KeycloakClientRepresentation {
  id: string;
  clientId: string;
  bearerOnly: boolean;
  description: string;
  publicClient: boolean;
  standardFlowEnabled: boolean;
  implicitFlowEnabled: boolean;
  directAccessGrantsEnabled: boolean;
}

export const createKeycloakClientTemplate = (clientId: string, description?: string): KeycloakClientRepresentation => {
  return {
    id: uuidv4(),
    clientId,
    bearerOnly: true,
    description: description ? description : '',
    publicClient: false,
    standardFlowEnabled: false,
    directAccessGrantsEnabled: false,
    implicitFlowEnabled: false,
  };
};

export function KeycloakRoleToServiceRole(kcRoles: KeycloakClientRole[]): ServiceRole[] {
  return kcRoles.map((role) => {
    return {
      role: role.name,
      description: role.description,
    };
  });
}

export const Events = {
  update: 'service.role.update',
};

export type ServiceRoleConfig = Record<string, ConfigServiceRole>;
