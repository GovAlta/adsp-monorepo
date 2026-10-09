import { TokenHandlerClient } from './models';

export const FETCH_TOKEN_HANDLER_CLIENTS = 'tokenHandler/FETCH_CLIENTS';
export const FETCH_TOKEN_HANDLER_CLIENTS_SUCCESS = 'tokenHandler/FETCH_CLIENTS_SUCCESS';

export const SAVE_TOKEN_HANDLER_CLIENT = 'tokenHandler/SAVE_CLIENT';
export const SAVE_TOKEN_HANDLER_CLIENT_SUCCESS = 'tokenHandler/SAVE_CLIENT_SUCCESS';

export const DELETE_TOKEN_HANDLER_CLIENT = 'tokenHandler/DELETE_CLIENT';
export const DELETE_TOKEN_HANDLER_CLIENT_SUCCESS = 'tokenHandler/DELETE_CLIENT_SUCCESS';
export const DELETE_TOKEN_HANDLER_CLIENT_FAILED = 'tokenHandler/DELETE_CLIENT_FAILED';

export const GET_CLIENT_REGISTRATION = 'tokenHandler/GET_REGISTRATION';
export const GET_CLIENT_REGISTRATION_SUCCESS = 'tokenHandler/GET_REGISTRATION_SUCCESS';
export const GET_CLIENT_REGISTRATION_FAILED = 'tokenHandler/GET_REGISTRATION_FAILED';

export const REGISTER_TOKEN_HANDLER_CLIENT = 'tokenHandler/REGISTER_CLIENT';
export const REGISTER_TOKEN_HANDLER_CLIENT_SUCCESS = 'tokenHandler/REGISTER_CLIENT_SUCCESS';


export interface FetchTokenHandlerClientsAction {
  type: typeof FETCH_TOKEN_HANDLER_CLIENTS;
}

export interface FetchTokenHandlerClientsSuccessAction {
  type: typeof FETCH_TOKEN_HANDLER_CLIENTS_SUCCESS;
  payload: Record<string, TokenHandlerClient>;
}

export interface SaveTokenHandlerClientAction {
  type: typeof SAVE_TOKEN_HANDLER_CLIENT;
  payload: TokenHandlerClient;
}

export interface SaveTokenHandlerClientSuccessAction {
  type: typeof SAVE_TOKEN_HANDLER_CLIENT_SUCCESS;
  payload: Record<string, TokenHandlerClient>;
}

export interface DeleteTokenHandlerClientAction {
  type: typeof DELETE_TOKEN_HANDLER_CLIENT;
  payload: { clientId: string };
}

export interface DeleteTokenHandlerClientSuccessAction {
  type: typeof DELETE_TOKEN_HANDLER_CLIENT_SUCCESS;
  payload: { clientId: string };
}

export interface DeleteTokenHandlerClientFailedAction {
  type: typeof DELETE_TOKEN_HANDLER_CLIENT_FAILED;
  payload: { clientId: string };
}

export interface GetClientRegistrationAction {
  type: typeof GET_CLIENT_REGISTRATION;
  payload: { clientId: string };
}

export interface GetClientRegistrationSuccessAction {
  type: typeof GET_CLIENT_REGISTRATION_SUCCESS;
  payload: { clientId: string; keycloakClientId: string | null; keycloakUuid?: string };
}

export interface GetClientRegistrationFailedAction {
  type: typeof GET_CLIENT_REGISTRATION_FAILED;
  payload: { clientId: string };
}

export interface RegisterTokenHandlerClientAction {
  type: typeof REGISTER_TOKEN_HANDLER_CLIENT;
  payload: { clientId: string };
}

export interface RegisterTokenHandlerClientSuccessAction {
  type: typeof REGISTER_TOKEN_HANDLER_CLIENT_SUCCESS;
  payload: { clientId: string };
}

export type ActionTypes =
  | FetchTokenHandlerClientsAction
  | FetchTokenHandlerClientsSuccessAction
  | SaveTokenHandlerClientAction
  | SaveTokenHandlerClientSuccessAction
  | DeleteTokenHandlerClientAction
  | DeleteTokenHandlerClientSuccessAction
  | DeleteTokenHandlerClientFailedAction
  | GetClientRegistrationAction
  | GetClientRegistrationSuccessAction
  | GetClientRegistrationFailedAction
  | RegisterTokenHandlerClientAction
  | RegisterTokenHandlerClientSuccessAction;

export const FetchTokenHandlerClients = (): FetchTokenHandlerClientsAction => ({
  type: FETCH_TOKEN_HANDLER_CLIENTS,
});

export const FetchTokenHandlerClientsSuccess = (
  clients: Record<string, TokenHandlerClient>
): FetchTokenHandlerClientsSuccessAction => ({
  type: FETCH_TOKEN_HANDLER_CLIENTS_SUCCESS,
  payload: clients,
});

export const SaveTokenHandlerClient = (client: TokenHandlerClient): SaveTokenHandlerClientAction => ({
  type: SAVE_TOKEN_HANDLER_CLIENT,
  payload: client,
});

export const SaveTokenHandlerClientSuccess = (
  clients: Record<string, TokenHandlerClient>
): SaveTokenHandlerClientSuccessAction => ({
  type: SAVE_TOKEN_HANDLER_CLIENT_SUCCESS,
  payload: clients,
});

export const DeleteTokenHandlerClient = (clientId: string): DeleteTokenHandlerClientAction => ({
  type: DELETE_TOKEN_HANDLER_CLIENT,
  payload: { clientId },
});

export const DeleteTokenHandlerClientSuccess = (clientId: string): DeleteTokenHandlerClientSuccessAction => ({
  type: DELETE_TOKEN_HANDLER_CLIENT_SUCCESS,
  payload: { clientId },
});

export const DeleteTokenHandlerClientFailed = (clientId: string): DeleteTokenHandlerClientFailedAction => ({
  type: DELETE_TOKEN_HANDLER_CLIENT_FAILED,
  payload: { clientId },
});

export const GetClientRegistration = (clientId: string): GetClientRegistrationAction => ({
  type: GET_CLIENT_REGISTRATION,
  payload: { clientId },
});

export const GetClientRegistrationSuccess = (
  clientId: string,
  keycloakClientId: string | null,
  keycloakUuid?: string
): GetClientRegistrationSuccessAction => ({
  type: GET_CLIENT_REGISTRATION_SUCCESS,
  payload: { clientId, keycloakClientId, keycloakUuid },
});

export const GetClientRegistrationFailed = (clientId: string): GetClientRegistrationFailedAction => ({
  type: GET_CLIENT_REGISTRATION_FAILED,
  payload: { clientId },
});

export const RegisterTokenHandlerClient = (clientId: string): RegisterTokenHandlerClientAction => ({
  type: REGISTER_TOKEN_HANDLER_CLIENT,
  payload: { clientId },
});

export const RegisterTokenHandlerClientSuccess = (clientId: string): RegisterTokenHandlerClientSuccessAction => ({
  type: REGISTER_TOKEN_HANDLER_CLIENT_SUCCESS,
  payload: { clientId },
});
