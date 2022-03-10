import { put, select, call } from 'redux-saga/effects';
import { RootState } from '@store/index';
import { ErrorNotification } from '@store/notifications/actions';
import { FetchDirectoryAction, fetchDirectorySuccess } from './actions';
import { DirectoryApi } from './api';
import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator } from '@store/session/actions';

export function* fetchDirectory(action: FetchDirectoryAction): SagaIterator {
  const state: RootState = yield select();
  const token = state.session.credentials.token;
  const api = new DirectoryApi(state.config.tenantApi, token);
  const tenantName: string = yield select((state: RootState) => state.tenant.name);

  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading...',
    })
  );
  try {
    let directory = yield call([api, api.fetchDirectory]);
    let tenantDirectory = [];
    if (!directory[0]?.urn) {
      tenantDirectory = yield call([api, api.fetchDirectoryTenant], tenantName);
      directory = { ...directory, ...tenantDirectory };
    }
    const newDirectory = [];
    Object.keys(directory).forEach((dir, index) => {
      const urn = directory[dir].urn ? directory[dir].urn.split(':') : Object.keys(directory)[index].split(':');

      newDirectory.push({
        name: urn[2],
        namespace: urn.length === 5 ? `${urn[3]}:${urn[4]}` : urn[3],
        url: directory[dir].url ? directory[dir].url : directory[Object.keys(directory)[index]],
      });
    });

    yield put(fetchDirectorySuccess({ directory: newDirectory }));
    yield put(
      UpdateIndicator({
        show: false,
      })
    );
  } catch (e) {
    yield put(ErrorNotification({ message: 'failed to fetch directory' }));
    yield put(
      UpdateIndicator({
        show: false,
      })
    );
  }
}
