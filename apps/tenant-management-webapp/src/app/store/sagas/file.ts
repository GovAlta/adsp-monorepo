import { put } from 'redux-saga/effects';
import { TYPES } from '../actions';
import http from '../../api/http';


export function* fetchSpace(config) {

  // TODO: we might need to revisit this part
  const fileService = config.payload.fileService;
  const url = `${fileService.host}${fileService.endpoints.spaceAdmin}`;
  const user = config.payload.user;
  const token = user.jwt.token;

  const realm = user.keycloak.realm;
  const tenantId = user.keycloak.clientId;

  const headers = {
    Authorization: `Bearer ${token}`
  }

  const data = {
    tenantId: tenantId,
    realm: realm
  }

  try {
    const tenantSpaces = http.post(url, data, { headers: headers });
    const spaceInfo = yield tenantSpaces;
    yield put({ type: TYPES.FETCH_FILE_SPACE_SUCCEEDED, payload: spaceInfo });
  } catch (e) {
    // Unexpected Http Error
    yield put({ type: TYPES.HTTP_ERROR, message: e.message });
  }
}
