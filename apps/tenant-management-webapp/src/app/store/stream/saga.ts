import { put, select, call, takeEvery } from 'redux-saga/effects';
import { RootState } from '@store/index';
import { ErrorNotification } from '@store/notifications/actions';
import {
  fetchCoreStreamsSuccess,
  fetchTenantStreamsSuccess,
  FETCH_CORE_STREAMS,
  FETCH_TENANT_STREAMS,
} from './actions';
import { SagaIterator } from '@redux-saga/core';
import axios from 'axios';
import { CORE_TENANT } from '@store/tenant/models';
import { UpdateIndicator } from '@store/session/actions';

function selectConfigBaseUrl(state: RootState): string {
  return state.config.serviceUrls.configurationServiceApiUrl;
}

function selectToken(state: RootState): string {
  return state.session.credentials.token;
}

function selectTenant(state: RootState): string {
  return state.tenant.name;
}

const SERVICE_NAME = 'push-service';
const API_VERSION = 'v2';

export function* fetchCoreStreams(): SagaIterator {
  try {
    yield put(
      UpdateIndicator({
        show: true,
        message: 'Loading...',
      })
    );
    const state: RootState = yield select();
    const baseUrl = selectConfigBaseUrl(state);
    const token = selectToken(state);

    const response = yield call(
      axios.get,
      `${baseUrl}/configuration/${API_VERSION}/configuration/platform/${SERVICE_NAME}/latest?core`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    yield put(fetchCoreStreamsSuccess(response.data));
    yield put(
      UpdateIndicator({
        show: false,
      })
    );
  } catch (e) {
    yield put(
      UpdateIndicator({
        show: false,
      })
    );
    yield put(ErrorNotification({ message: e.message }));
  }
}

export function* fetchTenantStreams(): SagaIterator {
  try {
    yield put(
      UpdateIndicator({
        show: true,
        message: 'Loading...',
      })
    );
    const state: RootState = yield select();
    const baseUrl = selectConfigBaseUrl(state);
    const token = selectToken(state);
    const tenant = selectTenant(state);

    if (tenant !== CORE_TENANT) {
      const response = yield call(
        axios.get,
        `${baseUrl}/configuration/${API_VERSION}/configuration/platform/${SERVICE_NAME}/latest`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      yield put(fetchTenantStreamsSuccess(response.data));
    }

    yield put(
      UpdateIndicator({
        show: false,
      })
    );
  } catch (e) {
    yield put(
      UpdateIndicator({
        show: false,
      })
    );
    yield put(ErrorNotification({ message: e.message }));
  }
}

export function* watchStreamSagas(): Generator {
  yield takeEvery(FETCH_CORE_STREAMS, fetchCoreStreams);
  yield takeEvery(FETCH_TENANT_STREAMS, fetchTenantStreams);
}
