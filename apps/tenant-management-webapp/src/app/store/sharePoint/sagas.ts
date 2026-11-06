import axios from 'axios';
import { SagaIterator } from '@redux-saga/core';
import { call, put, select, takeEvery } from 'redux-saga/effects';
import { RootState } from '..';
import { UpdateIndicator } from '@store/session/actions';
import { ErrorNotification } from '@store/notifications/actions';
import { getAccessToken } from '@store/tenant/sagas';
import {
  DELETE_SHAREPOINT_CONNECTION_ACTION,
  DELETE_SHAREPOINT_DESTINATION_ACTION,
  DeleteSharepointConnectionAction,
  DeleteSharepointDestinationAction,
  FETCH_SHAREPOINT_CONFIGURATION_ACTION,
  FETCH_SHAREPOINT_CREDENTIAL_STATUS_ACTION,
  fetchSharepointConfigurationSuccess,
  FetchSharepointCredentialStatusAction,
  fetchSharepointCredentialStatusSuccess,
  SharepointConfiguration,
  SharepointConnection,
  SharepointDestination,
  TEST_SHAREPOINT_DESTINATION_ACTION,
  TestSharepointDestinationAction,
  testSharepointDestinationSuccess,
  UPDATE_SHAREPOINT_CONNECTION_ACTION,
  UPDATE_SHAREPOINT_DESTINATION_ACTION,
  updateSharepointConfigurationSuccess,
  UpdateSharepointConnectionAction,
  UpdateSharepointDestinationAction,
} from './actions';

const CONFIGURATION_PATH = 'configuration/v2/configuration/platform/test-sharepoint-service';

const selectConfigurationUrl = (state: RootState) =>
  `${state.config.serviceUrls?.configurationServiceApiUrl}/${CONFIGURATION_PATH}`;
const selectSharepointApiUrl = (path: string) => (state: RootState) =>
  `${state.config.serviceUrls?.sharepointServiceApiUrl}/sharepoint/v1${path}`;
const credentialPath = (connectionId: string) => `/connections/${encodeURIComponent(connectionId)}/credentials`;

export const toSharepointConfiguration = (raw?: Partial<SharepointConfiguration>): SharepointConfiguration => ({
  connections: raw?.connections || {},
  destinations: raw?.destinations || {},
});

const without = <T>(items: Record<string, T>, id: string): Record<string, T> =>
  Object.fromEntries(Object.entries(items).filter(([key]) => key !== id));

export function* patchSharepointConfiguration(
  body:
    | { operation: 'UPDATE'; update: Partial<SharepointConfiguration> }
    | { operation: 'REPLACE'; configuration: SharepointConfiguration },
): SagaIterator {
  const url: string = yield select(selectConfigurationUrl);
  const token: string = yield call(getAccessToken);
  const { data } = yield call(axios.patch, url, body, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  yield put(updateSharepointConfigurationSuccess(toSharepointConfiguration(data?.latest?.configuration)));
}

// Configuration Service UPDATE merges nested objects, so removing an entry needs a REPLACE of the whole document.
function* replaceSharepointConfiguration(change: Partial<SharepointConfiguration>): SagaIterator {
  const current: SharepointConfiguration = yield select((state: RootState) => ({
    connections: state.sharepoint.connections,
    destinations: state.sharepoint.destinations,
  }));
  yield call(patchSharepointConfiguration, { operation: 'REPLACE', configuration: { ...current, ...change } });
}

export function* fetchSharepointConfigurationSaga(): SagaIterator {
  yield put(UpdateIndicator({ show: true, message: 'Loading...' }));
  try {
    const url: string = yield select(selectConfigurationUrl);
    const token: string = yield call(getAccessToken);
    const { data } = yield call(axios.get, url, { headers: { Authorization: `Bearer ${token}` } });
    const latest = data?.latest || data || {};
    yield put(fetchSharepointConfigurationSuccess(toSharepointConfiguration(latest.configuration)));
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  } finally {
    yield put(UpdateIndicator({ show: false }));
  }
}

export function* updateSharepointConnectionSaga({
  payload: { connection, clientSecret },
}: UpdateSharepointConnectionAction): SagaIterator {
  yield put(UpdateIndicator({ show: true, message: 'Saving...' }));
  try {
    const connections: Record<string, SharepointConnection> = yield select(
      (state: RootState) => state.sharepoint.connections,
    );
    yield call(patchSharepointConfiguration, {
      operation: 'UPDATE',
      update: { connections: { ...connections, [connection.id]: connection } },
    });

    if (clientSecret) {
      const url: string = yield select(selectSharepointApiUrl(credentialPath(connection.id)));
      const token: string = yield call(getAccessToken);
      const { data } = yield call(axios.put, url, { clientSecret }, { headers: { Authorization: `Bearer ${token}` } });
      yield put(fetchSharepointCredentialStatusSuccess(connection.id, data));
    }
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  } finally {
    yield put(UpdateIndicator({ show: false }));
  }
}

export function* deleteSharepointConnectionSaga({ id }: DeleteSharepointConnectionAction): SagaIterator {
  yield put(UpdateIndicator({ show: true, message: 'Saving...' }));
  try {
    const url: string = yield select(selectSharepointApiUrl(credentialPath(id)));
    const token: string = yield call(getAccessToken);
    yield call(axios.delete, url, { headers: { Authorization: `Bearer ${token}` } });

    const connections: Record<string, SharepointConnection> = yield select(
      (state: RootState) => state.sharepoint.connections,
    );
    yield call(replaceSharepointConfiguration, { connections: without(connections, id) });
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  } finally {
    yield put(UpdateIndicator({ show: false }));
  }
}

export function* updateSharepointDestinationSaga({ payload }: UpdateSharepointDestinationAction): SagaIterator {
  yield put(UpdateIndicator({ show: true, message: 'Saving...' }));
  try {
    const destinations: Record<string, SharepointDestination> = yield select(
      (state: RootState) => state.sharepoint.destinations,
    );
    yield call(patchSharepointConfiguration, {
      operation: 'UPDATE',
      update: { destinations: { ...destinations, [payload.id]: payload } },
    });
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  } finally {
    yield put(UpdateIndicator({ show: false }));
  }
}

export function* deleteSharepointDestinationSaga({ id }: DeleteSharepointDestinationAction): SagaIterator {
  yield put(UpdateIndicator({ show: true, message: 'Saving...' }));
  try {
    const destinations: Record<string, SharepointDestination> = yield select(
      (state: RootState) => state.sharepoint.destinations,
    );
    yield call(replaceSharepointConfiguration, { destinations: without(destinations, id) });
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  } finally {
    yield put(UpdateIndicator({ show: false }));
  }
}

export function* fetchSharepointCredentialStatusSaga({ id }: FetchSharepointCredentialStatusAction): SagaIterator {
  try {
    const url: string = yield select(selectSharepointApiUrl(credentialPath(id)));
    const token: string = yield call(getAccessToken);
    const { data } = yield call(axios.get, url, { headers: { Authorization: `Bearer ${token}` } });
    yield put(fetchSharepointCredentialStatusSuccess(id, data));
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  }
}

export function* testSharepointDestinationSaga({ id, data }: TestSharepointDestinationAction): SagaIterator {
  try {
    const url: string = yield select(selectSharepointApiUrl(`/destinations/${encodeURIComponent(id)}/test`));
    const token: string = yield call(getAccessToken);
    const { data: result } = yield call(axios.post, url, data, { headers: { Authorization: `Bearer ${token}` } });
    yield put(testSharepointDestinationSuccess(id, result));
  } catch (err) {
    const status = err?.response?.status;
    yield put(
      testSharepointDestinationSuccess(id, {
        ok: false,
        errorCode: status ? `adsp:http-${status}` : 'adsp:unreachable',
      }),
    );
  }
}

export function* watchSharepointSagas(): Generator {
  yield takeEvery(FETCH_SHAREPOINT_CONFIGURATION_ACTION, fetchSharepointConfigurationSaga);
  yield takeEvery(UPDATE_SHAREPOINT_CONNECTION_ACTION, updateSharepointConnectionSaga);
  yield takeEvery(DELETE_SHAREPOINT_CONNECTION_ACTION, deleteSharepointConnectionSaga);
  yield takeEvery(UPDATE_SHAREPOINT_DESTINATION_ACTION, updateSharepointDestinationSaga);
  yield takeEvery(DELETE_SHAREPOINT_DESTINATION_ACTION, deleteSharepointDestinationSaga);
  yield takeEvery(FETCH_SHAREPOINT_CREDENTIAL_STATUS_ACTION, fetchSharepointCredentialStatusSaga);
  yield takeEvery(TEST_SHAREPOINT_DESTINATION_ACTION, testSharepointDestinationSaga);
}
