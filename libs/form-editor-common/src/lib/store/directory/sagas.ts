import axios from 'axios';
import { put, select, call, takeEvery } from 'redux-saga/effects';
import { RootState } from '../../store';
import { ErrorNotification } from '../notifications/actions';
import {
  FetchDirectoryAction,
  fetchDirectorySuccess,
  FETCH_DIRECTORY,
} from './actions';
import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator } from '../session/actions';

import { toKebabName } from '../../components/kebabName';
import { getAccessToken } from '../tenant/sagas';

export function* fetchDirectory(_action: FetchDirectoryAction): SagaIterator {
  const core = 'platform';
  const state: RootState = yield select();
  const token: string = yield call(getAccessToken);
  const tenantName: string = state.tenant.name ? state.tenant.name : core;
  const directoryBaseUrl: string = state.config.serviceUrls?.directoryServiceApiUrl;
  let tenantDirectoryData = [];

  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading...',
    })
  );
  if (directoryBaseUrl && token) {
    try {
      const { data: coreDirectory } = yield call(
        axios.get,
        `${directoryBaseUrl}/directory/v2/namespaces/${toKebabName(core)}/entries`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // if its our core Platform tenant then don't make this call
      if (tenantName !== 'Platform') {
        const { data: tenantDirectory } = yield call(
          axios.get,
          `${directoryBaseUrl}/directory/v2/namespaces/${toKebabName(tenantName)}/entries`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        tenantDirectoryData = tenantDirectory;
      }

      yield put(fetchDirectorySuccess([...tenantDirectoryData, ...coreDirectory]));

      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ message: 'Failed to fetch directory service', error: err }));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    }
  }
}

export function* watchDirectorySagas(): Generator {
  yield takeEvery(FETCH_DIRECTORY, fetchDirectory);

}
