import axios from 'axios';
import { put, select } from 'redux-saga/effects';
import { RootState } from '..';
import { ErrorNotification } from '../../store/notifications/actions';
import { FetchAccessSuccessAction } from './actions';
import { getToken } from '../../services/session'

const http = axios.create();

export function* fetchAccess() {
  const currentState: RootState = yield select();
  const url = `${currentState.config.tenantApi.host}/api/keycloak/v1/access`;

  const token = getToken();
  if (!token) {
    yield put(ErrorNotification({ message: `failed to get auth token - ${url}` }));
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  try {
    // FIXME: there is no schema validation of payload data
    const payload = yield http.get(url, { headers });
    const action: FetchAccessSuccessAction = {
      type: 'tenant/access/FETCH_ACCESS_SUCCESS',
      payload: payload.data,
    };

    yield put(action);
  } catch (e) {
    yield put(ErrorNotification({ message: `${e.message} - ${url}` }));
  }
}
