import axios from 'axios';
import { SagaIterator } from '@redux-saga/core';
import { select, put, call, takeEvery, takeLatest } from 'redux-saga/effects';
import { RootState } from '@store/index';
import { ErrorNotification, SuccessNotification } from '@store/notifications/actions';
import { getAccessToken } from '@store/tenant/sagas';
import {
  FETCH_TOKEN_HANDLER_CLIENTS,
  SAVE_TOKEN_HANDLER_CLIENT,
  DELETE_TOKEN_HANDLER_CLIENT,
  GET_CLIENT_REGISTRATION,
  REGISTER_TOKEN_HANDLER_CLIENT,
  SaveTokenHandlerClientAction,
  DeleteTokenHandlerClientAction,
  GetClientRegistrationAction,
  RegisterTokenHandlerClientAction,
  FetchTokenHandlerClientsSuccess,
  SaveTokenHandlerClientSuccess,
  DeleteTokenHandlerClientFailed,
  DeleteTokenHandlerClientSuccess,
  GetClientRegistrationFailed,
  GetClientRegistrationSuccess,
  RegisterTokenHandlerClientSuccess,
  GetClientRegistration,
} from './actions';

export function* fetchTokenHandlerClients(): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);

  if (configBaseUrl && token) {
    try {
      const { data } = yield call(
        axios.get,
        `${configBaseUrl}/configuration/v2/configuration/platform/token-handler/latest`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      yield put(FetchTokenHandlerClientsSuccess(data?.clients || {}));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* saveTokenHandlerClient({ payload: client }: SaveTokenHandlerClientAction): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);

  if (configBaseUrl && token) {
    try {
      const { data } = yield call(
        axios.patch,
        `${configBaseUrl}/configuration/v2/configuration/platform/token-handler`,
        { operation: 'UPDATE', update: { clients: { [client.id]: client } } },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      yield put(SaveTokenHandlerClientSuccess(data?.latest?.configuration?.clients || {}));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* deleteTokenHandlerClient({ payload: { clientId } }: DeleteTokenHandlerClientAction): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);

  if (configBaseUrl && token) {
    try {
      yield call(
        axios.patch,
        `${configBaseUrl}/configuration/v2/configuration/platform/token-handler`,
        { operation: 'DELETE', property: `clients.${clientId}` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      yield put(DeleteTokenHandlerClientSuccess(clientId));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
      yield put(DeleteTokenHandlerClientFailed(clientId));
    }
  } else {
    yield put(ErrorNotification({ message: 'Unable to delete the client; the configuration service is not available.' }));
    yield put(DeleteTokenHandlerClientFailed(clientId));
  }
}

export function* getClientRegistration({ payload: { clientId } }: GetClientRegistrationAction): SagaIterator {
  const tokenHandlerApiUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.tokenHandlerApiUrl
  );
  const token: string = yield call(getAccessToken);

  if (tokenHandlerApiUrl && token) {
    let keycloakClientId: string | null;
    try {
      const { data } = yield call(axios.get, `${tokenHandlerApiUrl}/token-handler/v1/clients/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      keycloakClientId = data?.clientId || null;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        keycloakClientId = null;
      } else {
        // The registration state is unknown; do not report the client as not registered.
        yield put(ErrorNotification({ error: err }));
        yield put(GetClientRegistrationFailed(clientId));
        return;
      }
    }

    const keycloakUuid: string | undefined = keycloakClientId
      ? yield call(getKeycloakClientUuid, keycloakClientId, token)
      : undefined;
    yield put(GetClientRegistrationSuccess(clientId, keycloakClientId, keycloakUuid));
  } else {
    yield put(GetClientRegistrationFailed(clientId));
  }
}

// Looks up the Keycloak internal ID needed to link to the client in the admin console. This only enables a deep
// link, so failure is not reported and the link falls back to the realm's clients.
export function* getKeycloakClientUuid(keycloakClientId: string, token: string): SagaIterator {
  const keycloakBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.keycloakUrl);
  const realm: string = yield select((state: RootState) => state.session.realm);

  if (keycloakBaseUrl && realm) {
    try {
      const { data } = yield call(axios.get, `${keycloakBaseUrl}/auth/admin/realms/${realm}/clients`, {
        params: { clientId: keycloakClientId },
        headers: { Authorization: `Bearer ${token}` },
      });
      return data?.[0]?.id as string | undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function* registerTokenHandlerClient({
  payload: { clientId },
}: RegisterTokenHandlerClientAction): SagaIterator {
  const keycloakBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.keycloakUrl);
  const realm: string = yield select((state: RootState) => state.session.realm);
  const tokenHandlerApiUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.tokenHandlerApiUrl
  );
  const token: string = yield call(getAccessToken);

  if (keycloakBaseUrl && tokenHandlerApiUrl && token && realm) {
    try {
      const { data: initialAccess } = yield call(
        axios.post,
        `${keycloakBaseUrl}/auth/admin/realms/${realm}/clients-initial-access`,
        { count: 1, expiration: 300 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      yield call(
        axios.post,
        `${tokenHandlerApiUrl}/token-handler/v1/clients/${clientId}`,
        { registrationToken: initialAccess.token },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      yield put(RegisterTokenHandlerClientSuccess(clientId));
      yield put(SuccessNotification({
          message: `Client "${clientId}" registered. Add its redirect URIs in the Keycloak admin console before signing in.`,
        }));
      yield put(GetClientRegistration(clientId));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
      yield put(RegisterTokenHandlerClientSuccess(clientId));
    }
  } else {
    yield put(ErrorNotification({ message: 'Unable to register the client; the token handler service is not available.' }));
    yield put(RegisterTokenHandlerClientSuccess(clientId));
  }
}

export function* watchTokenHandlerSagas(): Generator {
  yield takeEvery(FETCH_TOKEN_HANDLER_CLIENTS, fetchTokenHandlerClients);
  yield takeEvery(SAVE_TOKEN_HANDLER_CLIENT, saveTokenHandlerClient);
  yield takeEvery(DELETE_TOKEN_HANDLER_CLIENT, deleteTokenHandlerClient);
  yield takeLatest(GET_CLIENT_REGISTRATION, getClientRegistration);
  yield takeEvery(REGISTER_TOKEN_HANDLER_CLIENT, registerTokenHandlerClient);
}
