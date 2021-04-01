import { put, select } from 'redux-saga/effects';

import { ApiUptimeFetchSuccessAction } from './actions';
import { ErrorNotification } from '@store/notifications/actions';
import StatusApi from './api';
import { RootState } from '@store/index';

export function* uptimeFetch() {
  const state: RootState = yield select();
  const api = new StatusApi(state.config.tenantApi, state.session.credentials.token);

  try {
    const uptime = yield api.fetchStatus();
    yield put({
      type: 'api-status/uptime/fetch_success',
      payload: { status: 'loaded', uptime },
    } as ApiUptimeFetchSuccessAction);
  } catch (error) {
    console.error(error);
    yield put(ErrorNotification({ message: 'failed to fetch uptime' }));
  }
}
