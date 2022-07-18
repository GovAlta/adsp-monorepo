import { createSelectorCreator, defaultMemoize } from 'reselect';
import { RootState } from '@store/index';
import { isEqual } from 'lodash';

const createDeepEqualSelector = createSelectorCreator(defaultMemoize, isEqual);

// selector that returns realm roles and tenant clients and its roles
export const tenantRolesAndClients = createDeepEqualSelector(
  (state: RootState) => state.tenant?.realmRoles,
  (state: RootState) => state.serviceRoles?.keycloak,
  (realmRoles, tenantClients) => {
    return {
      realmRoles,
      tenantClients,
    };
  }
);
