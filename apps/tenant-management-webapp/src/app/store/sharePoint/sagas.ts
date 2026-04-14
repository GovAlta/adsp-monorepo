// sharepoint/saga.ts

import axios from 'axios';
import { SagaIterator } from '@redux-saga/core';
import { call, put, select, takeEvery } from 'redux-saga/effects';
import { RootState } from '..';
import { UpdateIndicator } from '@store/session/actions';
import { ErrorNotification } from '@store/notifications/actions';
import { getAccessToken } from '@store/tenant/sagas';
import {
  DELETE_SHAREPOINT_CONNECTION_ACTION,
  DeleteSharepointConnectionAction,
  deleteSharepointConnectionSuccess,
  FETCH_SHAREPOINT_CONNECTIONS_ACTION,
  FetchSharepointConnectionsAction,
  fetchSharepointConnectionsSuccess,
  SharepointConnection,
  UPDATE_SHAREPOINT_CONNECTION_ACTION,
  UpdateSharepointConnectionAction,
  updateSharepointConnectionSuccess,
} from './actions';

const SHAREPOINT_CONFIGURATION_PATH = 'sharepoint-service';

interface LatestSharepointConfiguration {
  configuration?: Record<string, SharepointConnection>;
}

export function* fetchSharepointConfiguration(_action: FetchSharepointConnectionsAction): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading...',
    }),
  );

  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield call(getAccessToken);

  try {
    const url = `${baseUrl}/configuration/v2/configuration/platform/${SHAREPOINT_CONFIGURATION_PATH}`;
    const { data } = yield call(axios.get, url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const latest: LatestSharepointConfiguration = data?.latest || data || {};
    const connections = latest.configuration || {};

    yield put(fetchSharepointConnectionsSuccess(connections));
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  } finally {
    yield put(
      UpdateIndicator({
        show: false,
      }),
    );
  }
}

export function* updateSharepointConnection({ payload }: UpdateSharepointConnectionAction): SagaIterator {
  const connection = { [payload.id]: { ...payload } };
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Saving...',
    }),
  );

  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield call(getAccessToken);

  try {
    const body = {
      operation: 'UPDATE',
      update: { ...connection },
    };

    const url = `${baseUrl}/configuration/v2/configuration/platform/${SHAREPOINT_CONFIGURATION_PATH}`;

    const {
      data: { latest },
    } = yield call(axios.patch, url, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    yield put(
      updateSharepointConnectionSuccess({
        ...latest.configuration,
      }),
    );
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  } finally {
    yield put(
      UpdateIndicator({
        show: false,
      }),
    );
  }
}

export function* deleteSharepointConnection(action: DeleteSharepointConnectionAction): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Saving...',
    }),
  );

  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield call(getAccessToken);
  const existingConnections: Record<string, SharepointConnection> = yield select(
    (state: RootState) => state.sharepoint?.connections || [],
  );

  try {
    const updatedConnections = { ...existingConnections };
    delete updatedConnections[action.id];

    const body = {
      operation: 'REPLACE',
      configuration: updatedConnections,
    };

    const url = `${baseUrl}/configuration/v2/configuration/platform/${SHAREPOINT_CONFIGURATION_PATH}`;

    yield call(axios.patch, url, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    yield put(deleteSharepointConnectionSuccess(updatedConnections));
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  } finally {
    yield put(
      UpdateIndicator({
        show: false,
      }),
    );
  }
}

export function* watchSharepointSagas(): Generator {
  yield takeEvery(FETCH_SHAREPOINT_CONNECTIONS_ACTION, fetchSharepointConfiguration);
  yield takeEvery(UPDATE_SHAREPOINT_CONNECTION_ACTION, updateSharepointConnection);
  yield takeEvery(DELETE_SHAREPOINT_CONNECTION_ACTION, deleteSharepointConnection);
}
