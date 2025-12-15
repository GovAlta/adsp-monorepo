import { createSelector } from '@reduxjs/toolkit';
import { AppState } from '../store';


interface ClientElement {
  roleNames: string[];
  clientId: string;
}

type ServiceRoles = ServiceRole[];

interface ConfigServiceRole {
  roles?: ServiceRoles;
}

export interface ServiceRole {
  role: string;
  description: string;
  inTenantAdmin?: boolean;
}


export const rolesSelector = createSelector(
  (state: AppState) => state.keycloak.realmRoles || [],
  (state: AppState) => state.keycloak.keycloakRoles || {},
  (roles, serviceRoles) => {
    const roleNames = roles.map((role) => {
      return role.name;
    });

    const elements: ClientElement[] = [{ roleNames: roleNames, clientId: '' }];
    return elements.concat(
      ...Object.entries(serviceRoles)
        .filter(([_clientId, config]) => {
          return (config as ConfigServiceRole)?.roles?.length || 0 > 0;
        })
        .map(([clientId, config]) => {
          const roles = (config as ConfigServiceRole).roles;
          const roleNames = (roles || []).map((role) => {
            return role.role;
          });
          return { roleNames, clientId };
        })
    );
  }
);
