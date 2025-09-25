import { createSelector } from 'reselect';
import { RootState } from '../../store';
import { ConfigServiceRole } from './models';

interface ClientElement {
  roleNames: string[];
  clientId: string;
}

export const rolesSelector = createSelector(
  (state: RootState) => state.tenant.realmRoles || [],
  (state: RootState) => state.serviceRoles.keycloak || {},
  (roles, serviceRoles) => {
    const roleNames = roles.map((role) => {
      return role.name;
    });

    const elements: ClientElement[] = [{ roleNames: roleNames, clientId: '' }];
    return elements.concat(
      ...Object.entries(serviceRoles)
        .filter(([_clientId, config]) => {
          return (config as ConfigServiceRole).roles.length > 0;
        })
        .map(([clientId, config]) => {
          const roles = (config as ConfigServiceRole).roles;
          const roleNames = roles.map((role) => {
            return role.role;
          });
          return { roleNames, clientId };
        })
    );
  }
);
