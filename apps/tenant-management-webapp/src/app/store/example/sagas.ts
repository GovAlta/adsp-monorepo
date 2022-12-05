import { put, select, call, takeEvery } from 'redux-saga/effects';
import { RootState } from '@store/index';
import { fetchDirectorySuccess, FETCH_DIRECTORY } from './actions';
import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator } from '@store/session/actions';
import { toKebabName } from '@lib/kebabName';
import { getAccessToken } from '@store/tenant/sagas';
import { fetchDirectories } from './api';

export function* fetchDirectory(): SagaIterator {
  const core = 'platform';
  const state: RootState = yield select();
  const token: string = yield call(getAccessToken);
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
      const url = `${directoryBaseUrl}/directory/v2/namespaces/${toKebabName(core)}/entries`;
      const coreDirectory = yield call(fetchDirectories, url, token);
      yield put(fetchDirectorySuccess({ directory: [...coreDirectory] }));

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
    }
  }
}

export function* DirectorySaga(): Generator {
  yield takeEvery(FETCH_DIRECTORY, fetchDirectory);
}
