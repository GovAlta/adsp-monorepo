import { put, select, call, fork } from 'redux-saga/effects';
import { RootState } from '@store/index';
import { ErrorNotification } from '@store/notifications/actions';
import { StatusApi } from './api';
import {
  SaveApplicationAction,
  saveApplicationSuccess,
  fetchServiceStatusAppsSuccess,
  fetchServiceStatusApps as refreshServiceStatusApps,
  DeleteApplicationAction,
  deleteApplicationSuccess,
  ToggleApplicationStatusAction,
  fetchServiceStatusAppHealthSuccess,
  fetchServiceStatusAppHealth,
} from './actions';
import { Session } from '@store/session/models';
import { ConfigState } from '@store/config/models';
import { SetApplicationStatusAction, setApplicationStatusSuccess } from './actions/setApplicationStatus';
import { EndpointStatusEntry, ServiceStatusApplication } from './models';
import { SagaIterator } from '@redux-saga/core';

export function* fetchServiceStatusAppHealthEffect(
  api: StatusApi,
  application: ServiceStatusApplication
): SagaIterator {
  // This is so application state knows there is an incremental load.
  yield put(fetchServiceStatusAppHealth(application._id));

  const entryMap: EndpointStatusEntry[] = yield call([api, api.getEndpointStatusEntries], application._id);
  application.endpoint.statusEntries = entryMap;

  yield put(fetchServiceStatusAppHealthSuccess(application._id, entryMap));
}

export function* fetchServiceStatusApps(): SagaIterator {
  const currentState: RootState = yield select();

  const baseUrl = getServiceStatusUrl(currentState.config);
  const token = getToken(currentState.session);

  try {
    const api = new StatusApi(baseUrl, token);
    const applications: ServiceStatusApplication[] = yield call([api, api.getApplications]);

    for (const application of applications) {
      yield fork(fetchServiceStatusAppHealthEffect, api, application);
    }

    yield put(fetchServiceStatusAppsSuccess(applications));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

export function* saveApplication(action: SaveApplicationAction): SagaIterator {
  const currentState: RootState = yield select();

  const baseUrl = getServiceStatusUrl(currentState.config);
  const token = getToken(currentState.session);
  try {
    const api = new StatusApi(baseUrl, token);
    const data = yield call([api, api.saveApplication], action.payload);
    yield put(saveApplicationSuccess(data));
    yield put(refreshServiceStatusApps());
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

export function* deleteApplication(action: DeleteApplicationAction): SagaIterator {
  const currentState: RootState = yield select();

  const baseUrl = getServiceStatusUrl(currentState.config);
  const token = getToken(currentState.session);

  try {
    const api = new StatusApi(baseUrl, token);
    yield call([api, api.deleteApplication], action.payload.applicationId);

    yield put(deleteApplicationSuccess(action.payload.applicationId));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

export function* setApplicationStatus(action: SetApplicationStatusAction): SagaIterator {
  const currentState: RootState = yield select();

  const baseUrl = getServiceStatusUrl(currentState.config);
  const token = getToken(currentState.session);

  try {
    const api = new StatusApi(baseUrl, token);
    const data: ServiceStatusApplication = yield call(
      [api, api.setStatus],
      action.payload.applicationId,
      action.payload.status
    );

    // status entries
    const entryMap: EndpointStatusEntry[] = yield call(
      [api, api.getEndpointStatusEntries],
      action.payload.applicationId
    );
    data.endpoint.statusEntries = entryMap;

    yield put(setApplicationStatusSuccess(data));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

export function* toggleApplicationStatus(action: ToggleApplicationStatusAction) {
  const currentState: RootState = yield select();

  const baseUrl = getServiceStatusUrl(currentState.config);
  const token = getToken(currentState.session);

  try {
    const api = new StatusApi(baseUrl, token);
    const data: ServiceStatusApplication = yield api.toggleApplication(
      action.payload.applicationId,
      action.payload.enabled
    );

    // status entries
    const entryMap: EndpointStatusEntry[] = yield call(
      [api, api.getEndpointStatusEntries],
      action.payload.applicationId
    );
    data.endpoint.statusEntries = entryMap;

    yield put(setApplicationStatusSuccess(data));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

function getToken(session: Session): string {
  return session?.credentials?.token;
}

function getServiceStatusUrl(config: ConfigState): string {
  return config.serviceUrls.serviceStatusApiUrl;
}
