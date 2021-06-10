import { put, select } from 'redux-saga/effects';
import { RootState } from '@store/index';
import { ErrorNotification } from '@store/notifications/actions';
import { StatusApi } from './api';
import {
  SaveApplicationAction,
  saveApplicationSuccess,
  fetchServiceStatusAppsSuccess,
  DeleteApplicationAction,
  deleteApplicationSuccess,
} from './actions';
import { Session } from '@store/session/models';
import { ConfigState } from '@store/config/models';
import { SetApplicationStatusAction, setApplicationStatusSuccess } from './actions/setApplicationStatus';

export function* fetchServiceStatusApps() {
  const currentState: RootState = yield select();

  const baseUrl = getServiceStatusUrl(currentState.config);
  const token = getToken(currentState.session);

  try {
    const api = new StatusApi(baseUrl, token);
    const data = yield api.getApplications();

    yield put(fetchServiceStatusAppsSuccess(data));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

export function* saveApplication(action: SaveApplicationAction) {
  const currentState: RootState = yield select();

  const baseUrl = getServiceStatusUrl(currentState.config);
  const token = getToken(currentState.session);

  try {
    const api = new StatusApi(baseUrl, token);
    const data = yield api.saveApplication(action.payload);
    yield put(saveApplicationSuccess(data));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

export function* deleteApplication(action: DeleteApplicationAction) {
  const currentState: RootState = yield select();

  const baseUrl = getServiceStatusUrl(currentState.config);
  const token = getToken(currentState.session);

  try {
    const api = new StatusApi(baseUrl, token);
    yield api.deleteApplication(action.payload.applicationId);

    yield put(deleteApplicationSuccess(action.payload.applicationId));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

export function* setApplicationStatus(action: SetApplicationStatusAction) {
  const currentState: RootState = yield select();

  const baseUrl = getServiceStatusUrl(currentState.config);
  const token = getToken(currentState.session);

  try {
    const api = new StatusApi(baseUrl, token);
    const data = yield api.setStatus(action.payload.applicationId, action.payload.status);

    yield put(setApplicationStatusSuccess(data));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

function getToken(session: Session): string {
  return session.credentials.token;
}

function getServiceStatusUrl(config: ConfigState): string {
  return config.serviceUrls.serviceStatusApiUrl;
}
