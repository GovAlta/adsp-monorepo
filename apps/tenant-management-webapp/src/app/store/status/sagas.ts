import { put, select } from 'redux-saga/effects';
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
} from './actions';
import { Session } from '@store/session/models';
import { ConfigState } from '@store/config/models';
import { SetApplicationStatusAction, setApplicationStatusSuccess } from './actions/setApplicationStatus';
import { EndpointStatusEntry, ServiceStatusApplication } from './models';

export function* fetchServiceStatusApps() {
  const currentState: RootState = yield select();

  const baseUrl = getServiceStatusUrl(currentState.config);
  const token = getToken(currentState.session);

  try {
    const api = new StatusApi(baseUrl, token);
    const applications: ServiceStatusApplication[] = yield api.getApplications();
    for (const application of applications) {
      const entryMap: { [key: string]: EndpointStatusEntry[] } = yield api.getEndpointStatusEntries(application._id);
      for (const [url, entries] of Object.entries(entryMap)) {
        const endpoint = application.endpoints.find((endpoint) => endpoint.url === url);
        endpoint.statusEntries = entries;
      }
    }

    yield put(fetchServiceStatusAppsSuccess(applications));
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
    yield put(refreshServiceStatusApps());
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
    const data: ServiceStatusApplication = yield api.setStatus(action.payload.applicationId, action.payload.status);

    yield put(setApplicationStatusSuccess(data));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

function getToken(session: Session): string {
  return session?.credentials?.token;
}

function getServiceStatusUrl(config: ConfigState): string {
  // return config.serviceUrls.serviceStatusApiUrl;
  return 'http://localhost:3338'
}
