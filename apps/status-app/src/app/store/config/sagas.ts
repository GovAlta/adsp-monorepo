import axios from 'axios';
import { put, call } from 'redux-saga/effects';
import { fetchConfigSuccess } from './actions';
import { SagaIterator } from '@redux-saga/core';
import { addErrorMessage } from '@store/session/actions';
import { ConfigState } from './models';

export function* fetchConfig(): SagaIterator {
  try {
    const config = (yield call(axios.get, '/config/config.json')).data as ConfigState;
    yield put(fetchConfigSuccess({ ...config, envLoaded: true }));
  } catch (e) {
    console.error(e.message);
    yield put(addErrorMessage({ message: e.message }));
  }
}
