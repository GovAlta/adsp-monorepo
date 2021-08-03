import axios from 'axios';
import { put, call } from 'redux-saga/effects';
import { FetchConfigSuccessAction } from './actions';
import { environment } from '../../environments/environment';
import { SagaIterator } from '@redux-saga/core';

export function* fetchConfig(): SagaIterator {
  try {
    const res = yield call(axios.get, '/config/config.json');
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
