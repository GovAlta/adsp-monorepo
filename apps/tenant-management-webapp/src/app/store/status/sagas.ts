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
import { ToggleApplicationAction, toggleApplicationSuccess } from './actions/toggleApplication';

export function* fetchServiceStatusApps() {
  const currentState: RootState = yield select();

  const baseUrl = currentState.config.serviceUrls?.serviceStatusApiUrl;
  const token = currentState.session.credentials.token;

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

  const baseUrl = currentState.config.serviceUrls?.serviceStatusApiUrl;
  const token = currentState.session.credentials.token;

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

  const baseUrl = currentState.config.serviceUrls?.serviceStatusApiUrl;
  const token = currentState.session.credentials.token;

  try {
    const api = new StatusApi(baseUrl, token);
    yield api.deleteApplication(action.payload.applicationId);

    yield put(deleteApplicationSuccess(action.payload.applicationId));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

export function* toggleApplication(action: ToggleApplicationAction) {
  const currentState: RootState = yield select();

  const baseUrl = currentState.config.serviceUrls?.serviceStatusApiUrl;
  const token = currentState.session.credentials.token;

  try {
    const api = new StatusApi(baseUrl, token);

    const data = yield api.toggleApplication(action.payload.applicationId, action.payload.enabled);

    yield put(toggleApplicationSuccess(data));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}
