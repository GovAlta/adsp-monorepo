import { put, select } from 'redux-saga/effects';
import { RootState } from '@store/index';
import { ErrorNotification } from '@store/notifications/actions';
import { HealthApi } from './api';
import { FetchHealthSuccessAction } from './actions';

export function* fetchHealth() {
  const currentState: RootState = yield select();

  const baseUrl = currentState.config.serviceUrls?.healthApi ?? 'localhost:3338';
  const token = currentState.session.credentials.token;
  const tenant = currentState.tenant;

  const api = new HealthApi(baseUrl, token);

  const data = yield api.getHealth(tenant.name);
  const action = {
    ...data,
  } as FetchHealthSuccessAction;

  try {
    yield put(action);
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}
