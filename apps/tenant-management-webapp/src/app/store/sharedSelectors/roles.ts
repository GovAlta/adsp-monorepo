import { createSelectorCreator, defaultMemoize } from 'reselect';
import { RootState } from '@store/index';
import { isEqual } from 'lodash';

const createDeepEqualSelector = createSelectorCreator(defaultMemoize, isEqual);

// selector that returns realm roles and tenant clients and its roles
export const tenantRolesAndClients = createDeepEqualSelector(
  (state: RootState) => {
    return state.tenant?.realmRoles?.sort((a, b) => a.name.localeCompare(b.name));
  },
  (state: RootState) => {
    const clients = state.serviceRoles?.keycloak;
    const keys = clients ? Object.keys(clients) : [];
    keys.forEach((key: string) => {
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
