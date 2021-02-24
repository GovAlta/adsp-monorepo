<<<<<<< Updated upstream
import { Keycloak } from '../reducers/config.contract';

export const CONFIG_SET_KEYCLOAK = 'tenant/config/set-keycloak';
=======
export const CONFIG_SET_KEYCLOAK = 'tenant/config/set-keycloak';

export interface Keycloak {
  realm: string;
  url: string;
  clientId: string;
}

>>>>>>> Stashed changes
export interface KeyCloakAction {
  type: string;
  payload: Keycloak;
}

export function setKeycloak(data: Keycloak): KeyCloakAction {
  return {
    type: CONFIG_SET_KEYCLOAK,
    payload: data,
  };
}
