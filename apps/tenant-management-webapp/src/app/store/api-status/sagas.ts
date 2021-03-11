import { put } from 'redux-saga/effects';

import { ApiUptimeFetchSuccessAction } from './actions';
import { ErrorNotification } from '../../store/notifications/actions';
import { http } from '../../api/tenant-management';

export function* uptimeFetch() {
  try {
    const res = yield http.get('/health');
    const action: ApiUptimeFetchSuccessAction = {
      type: 'api-status/uptime/fetch_success',
      payload: {
        status: 'loaded',
        uptime: res.uptime,
      },
    };

    yield put(action);
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}
