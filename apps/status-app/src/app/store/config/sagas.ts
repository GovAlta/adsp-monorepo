import axios from 'axios';
import { put, call } from 'redux-saga/effects';
import { fetchConfigSuccess } from './actions';
import { SagaIterator } from '@redux-saga/core';
import { addErrorMessage } from '@store/session/actions';
import { ConfigValues } from './models';

export function* fetchConfig(): SagaIterator {
  try {
    const config = (yield call(axios.get, '/config/config.json')).data as ConfigValues;
    yield put(fetchConfigSuccess(config));
  } catch (e) {
    console.error(e.message);
    yield put(addErrorMessage({ message: e.message }));
  }
}
