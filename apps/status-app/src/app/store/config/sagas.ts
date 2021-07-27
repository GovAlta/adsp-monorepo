import axios from 'axios';
import { put } from 'redux-saga/effects';
import { FetchConfigSuccessAction } from './actions';
import { environment } from '../../environments/environment';

export function* fetchConfig() {
  try {
    const res = yield axios.get('/config/config.json');
    const action: FetchConfigSuccessAction = {
      type: 'config/fetch-config-success',
      payload: res.data,
    };
    yield put(action);
  } catch (e) {
    const action: FetchConfigSuccessAction = {
      type: 'config/fetch-config-success',
      payload: environment,
    };
    yield put(action);
  }
}
