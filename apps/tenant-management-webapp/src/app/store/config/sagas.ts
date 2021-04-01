import axios from 'axios';
import { put, select } from 'redux-saga/effects';
import { RootState } from '@store/index';
import { ErrorNotification } from '@store/notifications/actions';
import { FetchConfigSuccessAction } from './actions';

export function* fetchConfig() {
  const state: RootState = yield select();

  try {
    if (!state.config?.keycloakApi?.realm) {
      const res = yield axios.get('/config.v2/config.json');
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
