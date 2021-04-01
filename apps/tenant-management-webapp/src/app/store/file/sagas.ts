import { put, select } from 'redux-saga/effects';

import { ErrorNotification } from '@store/notifications/actions';
import { FetchFileSpaceSuccess } from './actions';
import { RootState } from '@store/index';
import { FileApi } from './api';

export function* fetchSpace() {
  const state: RootState = yield select();

  const token = state.session.credentials.token;
  const api = new FileApi(state.config.tenantApi, token);
  const { clientId, realm } = state.session;

  try {
    const file = yield api.fetchSpace(clientId, realm);
    yield put(FetchFileSpaceSuccess({ data: file }));
  } catch (e) {
    yield put(ErrorNotification({ message: 'failed to fetch space' }));
  }
}
