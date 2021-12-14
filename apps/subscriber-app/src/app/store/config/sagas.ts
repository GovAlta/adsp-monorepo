import axios from 'axios';
import { put, select, call } from 'redux-saga/effects';
import { RootState } from '@store/index';
import { ErrorNotification } from '@store/notifications/actions';
import { FetchConfigSuccessAction } from './actions';
import { SagaIterator } from '@redux-saga/core';

export function* fetchConfig(): SagaIterator {
  const state: RootState = yield select();

  try {
    if (!state.config?.keycloakApi?.realm) {
      const res = yield call(axios.get, `/config/config.json?v=2`);
      const action: FetchConfigSuccessAction = {
        type: 'config/fetch-config-success',
        payload: res.data,
      };
      yield put(action);
    }
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}
