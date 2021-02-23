import INIT_STATE from './initialState';
import { CONFIG_SET_KEYCLOAK, KeyCloakAction } from '../actions/config';

export default function (state = INIT_STATE.config, action: KeyCloakAction) {
  switch (action.type) {
    case CONFIG_SET_KEYCLOAK:
      return {
        ...state,
        keycloak: {
          ...action.payload,
        },
      };
    default:
      return state;
  }
}
