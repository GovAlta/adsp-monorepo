import {
  ActionTypes,
  FETCH_TOKEN_HANDLER_CLIENTS_SUCCESS,
  SAVE_TOKEN_HANDLER_CLIENT_SUCCESS,
  DELETE_TOKEN_HANDLER_CLIENT,
  DELETE_TOKEN_HANDLER_CLIENT_FAILED,
  DELETE_TOKEN_HANDLER_CLIENT_SUCCESS,
  GET_CLIENT_REGISTRATION,
  GET_CLIENT_REGISTRATION_FAILED,
  GET_CLIENT_REGISTRATION_SUCCESS,
  REGISTER_TOKEN_HANDLER_CLIENT,
  REGISTER_TOKEN_HANDLER_CLIENT_SUCCESS,
} from './actions';
import { TokenHandlerState, TOKEN_HANDLER_INIT } from './models';

const withoutRegistration = (
  state: TokenHandlerState,
  clientId: string
): Pick<TokenHandlerState, 'registrations' | 'registrationErrors' | 'keycloakUuids'> => {
  const { [clientId]: _registration, ...registrations } = state.registrations;
  const { [clientId]: _error, ...registrationErrors } = state.registrationErrors;
  const { [clientId]: _uuid, ...keycloakUuids } = state.keycloakUuids;
  return { registrations, registrationErrors, keycloakUuids };
};

export default (state = TOKEN_HANDLER_INIT, action: ActionTypes): TokenHandlerState => {
  switch (action.type) {
    case FETCH_TOKEN_HANDLER_CLIENTS_SUCCESS:
      return { ...state, clients: action.payload };

    case SAVE_TOKEN_HANDLER_CLIENT_SUCCESS:
      return { ...state, clients: action.payload };

    case DELETE_TOKEN_HANDLER_CLIENT:
      return { ...state, busyClients: { ...state.busyClients, [action.payload.clientId]: true } };

    case DELETE_TOKEN_HANDLER_CLIENT_FAILED:
      return { ...state, busyClients: { ...state.busyClients, [action.payload.clientId]: false } };

    case DELETE_TOKEN_HANDLER_CLIENT_SUCCESS: {
      const { clientId } = action.payload;
      const remaining = { ...state.clients };
      delete remaining[clientId];
      return {
        ...state,
        clients: remaining,
        busyClients: { ...state.busyClients, [clientId]: false },
        ...withoutRegistration(state, clientId),
      };
    }

    // A new lookup discards the previous result so a stale registration state is never displayed.
    case GET_CLIENT_REGISTRATION:
      return { ...state, ...withoutRegistration(state, action.payload.clientId) };

    case GET_CLIENT_REGISTRATION_SUCCESS: {
      const { clientId, keycloakClientId, keycloakUuid } = action.payload;
      const cleared = withoutRegistration(state, clientId);
      return {
        ...state,
        registrations: { ...cleared.registrations, [clientId]: keycloakClientId },
        registrationErrors: cleared.registrationErrors,
        keycloakUuids: keycloakUuid ? { ...cleared.keycloakUuids, [clientId]: keycloakUuid } : cleared.keycloakUuids,
      };
    }

    case GET_CLIENT_REGISTRATION_FAILED:
      return {
        ...state,
        registrationErrors: { ...state.registrationErrors, [action.payload.clientId]: true },
      };

    case REGISTER_TOKEN_HANDLER_CLIENT:
      return {
        ...state,
        busyClients: { ...state.busyClients, [action.payload.clientId]: true },
      };

    case REGISTER_TOKEN_HANDLER_CLIENT_SUCCESS:
      return {
        ...state,
        busyClients: { ...state.busyClients, [action.payload.clientId]: false },
      };

    default:
      return state;
  }
};
