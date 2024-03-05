import { createSelectorCreator, defaultMemoize, createSelector } from 'reselect';
import { RootState } from '@store/index';
import { isEqual } from 'lodash';
import { v4 as uuidV4 } from 'uuid';

// Might need to move the type definition to another file later
export type RoleObject = Record<string, string[]>;

export const REALM_ROLE_KEY = uuidV4();

const createDeepEqualSelector = createSelectorCreator(defaultMemoize, isEqual);

// selector that returns realm roles and tenant clients and its roles
export const tenantRolesAndClients = createDeepEqualSelector(
  (state: RootState) => {
    return state.tenant?.realmRoles?.sort((a, b) => a.name.localeCompare(b.name));
  },
  (state: RootState) => {
    const clients = state.serviceRoles?.keycloak;
    const keys = clients ? Object.keys(clients) : [];
    keys.forEach((_key: string) => {
      for (const key of keys) {
        clients[key].roles = clients[key]?.roles?.sort((a, b) => a.role.localeCompare(b.role));
      }
    });
    return clients;
  },
  (realmRoles, tenantClients) => {
    return {
      realmRoles,
      tenantClients,
    };
  }
);

export const getRolesFromRoleUrns = (urns: string[]) => {
  return urns.map((u) => u.split(':').splice(-1));
};

export const constructRoleFromUrn = (urn: string) => {
  const elements = urn.split(':');
  const role = elements.pop();
  const clientId = elements.join(':');
  return [clientId, role];
};

export const constructRoleObjFromUrns = (urns?: string[]) => {
  const roleObject: RoleObject = {};
  if (!urns) return roleObject;
  urns.forEach((u) => {
    if (u.includes(':')) {
      const [clientId, role] = constructRoleFromUrn(u);
      if (!(clientId in roleObject)) roleObject[clientId] = [];
      roleObject[clientId].push(role);
    } else {
      if (!(REALM_ROLE_KEY in roleObject)) roleObject[REALM_ROLE_KEY] = [];
      roleObject[REALM_ROLE_KEY].push(u);
    }
  });

  return roleObject;
};

export const roleObjectToUrns = (roleObject: RoleObject) => {
  const roles = [];
  Object.entries(roleObject).forEach(([clientId, clientRoles]) => {
    if (clientId === REALM_ROLE_KEY) {
      clientRoles.map((r) => roles.push(r));
    } else {
      clientRoles.map((r) => roles.push(`${clientId}:${r}`));
    }
  });
  return roles;
};

export const selectRolesObject = createSelector(tenantRolesAndClients, (mergedRoles) => {
  const { realmRoles, tenantClients } = mergedRoles;
  const roleObject: RoleObject = {};

  if (realmRoles) {
    realmRoles.forEach((role) => {
      if (!(REALM_ROLE_KEY in roleObject)) roleObject[REALM_ROLE_KEY] = [];
      roleObject[REALM_ROLE_KEY].push(role.name);
    });
  }

  if (tenantClients) {
    Object.entries(tenantClients).forEach(([clientId, roleConfig]) => {
      if (roleConfig?.roles && roleConfig?.roles?.length > 0) {
        roleObject[clientId] = roleConfig?.roles?.map((role) => role.role);
      }
    });
  }

  return roleObject;
});

export const selectRoleList = createSelector(
  tenantRolesAndClients,
  (state: RootState) => state.tenant.name,
  (mergedRoles, tenantName) => {
    const roles = [];
    const { realmRoles, tenantClients } = mergedRoles;
    if (realmRoles?.length > 0) {
      roles.push({
        clientId: tenantName,
        roleNames: realmRoles?.map((r) => r.name),
      });
    }

    if (tenantClients) {
      Object.entries(tenantClients).forEach(([clientId, roleConfig]) => {
        if (roleConfig?.roles && roleConfig?.roles?.length > 0) {
          roles.push({
            clientId: clientId,
            roleNames: roleConfig?.roles.map((r) => r.role),
          });
        }
      });
    }

    return roles;
  }
);
