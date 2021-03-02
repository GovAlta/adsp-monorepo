import axios from 'axios';
import { put } from 'redux-saga/effects';
import { FETCH_ACCESSINFO_SUCCESS_ACTION } from './types';
import { HTTP_ERROR } from '../../store/actions/types';
import { FetchAccessAction } from './types';

const http = axios.create();

export function* fetchAccessInfo(params: FetchAccessAction) {
  const url = `${params.payload.tenant.host}/api/keycloak/v1/access`;

  const headers = {
    Authorization: `Bearer ${params.payload.user.jwt.token}`,
  };

  try {
    const payload = yield http.get(url, { headers });
    yield put({ type: FETCH_ACCESSINFO_SUCCESS_ACTION, payload: payload.data });
  } catch (e) {
    yield put({ type: HTTP_ERROR, message: e.message });
  }
}
