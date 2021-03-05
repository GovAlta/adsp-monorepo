import { put, select } from 'redux-saga/effects';

import { ErrorNotification } from '../../store/notifications/actions';
import { FetchFileSpaceSuccess } from './actions';
import { http } from '../../api/tenant-management';
import { RootState } from '..';
import { getToken } from '../../services/session';

export function* fetchSpace() {
  const state: RootState = yield select();

  const url = state.config.tenantApi.endpoints.spaceAdmin;
  const session = state.session;

  const headers = {
    Authorization: `Bearer ${getToken()}`,
  };

  const data = {
    tenantId: session.clientId,
    realm: session.realm,
  };

  try {
    const spaceInfo = yield http.post(url, data, { headers });

    yield put(FetchFileSpaceSuccess({ data: spaceInfo }));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}
