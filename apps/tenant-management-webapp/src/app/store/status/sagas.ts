import { put, select, call, fork, take } from 'redux-saga/effects';
import { RootState } from '@store/index';
import { ErrorNotification } from '@store/notifications/actions';
import { StatusApi, fetchStatusMetricsApi } from './api';
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
  fetchStatusMetricsSucceeded,
  FETCH_SERVICE_STATUS_APPS_SUCCESS_ACTION,
  FETCH_STATUS_CONFIGURATION,
  UpdateStatusContactInformationAction,
  FetchStatusConfigurationService,
  FetchStatusConfigurationSucceededService,
  toggleApplicationStatusSuccess,
  FETCH_SERVICE_STATUS_APPS_ACTION,
} from './actions';
import { ConfigState } from '@store/config/models';
import { SetApplicationStatusAction, setApplicationStatusSuccess } from './actions/setApplicationStatus';
import { EndpointStatusEntry, ApplicationStatus, MetricResponse } from './models';
import { SagaIterator } from '@redux-saga/core';
import moment from 'moment';
import axios from 'axios';
import { getAccessToken } from '@store/tenant/sagas';

import { UpdateLoadingState } from '@store/session/actions';

export function* fetchServiceStatusAppHealthEffect(api: StatusApi, application: ApplicationStatus): SagaIterator {
  try {
    yield put(fetchServiceStatusAppHealth(application.appKey));
    const entryMap: EndpointStatusEntry[] = yield call([api, api.getEndpointStatusEntries], application.appKey);
    application.endpoint.statusEntries = entryMap;
    yield put(fetchServiceStatusAppHealthSuccess(application.appKey, application.endpoint.url, entryMap));
  } catch (e) {
    yield put(ErrorNotification({ message: `${e.message} - fetchServiceStatusAppHealthEffect` }));
  }
}

export function* fetchServiceStatusApps(): SagaIterator {
  const currentState: RootState = yield select();

  yield put(
    UpdateLoadingState({
      name: FETCH_SERVICE_STATUS_APPS_ACTION,
      state: 'start',
    })
  );

  const statusServiceUrl = getServiceStatusUrl(currentState.config);
  const token = yield call(getAccessToken);

  try {
    const api = new StatusApi(statusServiceUrl, token);
    const applications: ApplicationStatus[] = yield call([api, api.getApplications]);

    for (const application of applications) {
      if (application.endpoint?.url) {
        yield fork(fetchServiceStatusAppHealthEffect, api, application);
      }
    }

    yield put(fetchServiceStatusAppsSuccess(applications));
    yield put(
      UpdateLoadingState({
        name: FETCH_SERVICE_STATUS_APPS_ACTION,
        state: 'completed',
      })
    );
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
    yield put(
      UpdateLoadingState({
        name: FETCH_SERVICE_STATUS_APPS_ACTION,
        state: 'error',
      })
    );
  }
}

export function* saveApplication(action: SaveApplicationAction): SagaIterator {
  const currentState: RootState = yield select();
  const statusApplications = currentState.serviceStatus.applications;
  let existingApp = false;

  for (const application of statusApplications) {
    existingApp = application.appKey === action.payload.appKey;
  }
  console.log('currentState', currentState);
  const baseUrl = getServiceStatusUrl(currentState.config);
  const token = yield call(getAccessToken);
  try {
    const api = new StatusApi(baseUrl, token);
    let data;

    if (existingApp) {
      data = yield call([api, api.updateApplication], action.payload);
    } else {
      data = yield call([api, api.saveApplication], action.payload);
    }
    yield put(saveApplicationSuccess(data));
    yield put(refreshServiceStatusApps());
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

export function* deleteApplication(action: DeleteApplicationAction): SagaIterator {
  const currentState: RootState = yield select();

  const baseUrl = getServiceStatusUrl(currentState.config);
  const token = yield call(getAccessToken);

  try {
    const api = new StatusApi(baseUrl, token);
    yield call([api, api.deleteApplication], action.payload.appKey);

    yield put(deleteApplicationSuccess(action.payload.appKey));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

export function* setApplicationStatus(action: SetApplicationStatusAction): SagaIterator {
  const currentState: RootState = yield select();

  const baseUrl = getServiceStatusUrl(currentState.config);
  const token = yield call(getAccessToken);

  try {
    const api = new StatusApi(baseUrl, token);
    const data: ApplicationStatus = yield call([api, api.setStatus], action.payload.appKey, action.payload.status);

    // status entries
    const entryMap: EndpointStatusEntry[] = yield call([api, api.getEndpointStatusEntries], action.payload.appKey);
    data.endpoint.statusEntries = entryMap;

    yield put(setApplicationStatusSuccess(data));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

export function* toggleApplicationStatus(action: ToggleApplicationStatusAction): SagaIterator {
  const currentState: RootState = yield select();

  const baseUrl = getServiceStatusUrl(currentState.config);
  const token = yield call(getAccessToken);

  try {
    const api = new StatusApi(baseUrl, token);
    const data: ApplicationStatus = yield call(
      [api, api.toggleApplication],
      action.payload.appKey,
      action.payload.enabled
    );

    data.enabled = action.payload.enabled;
    // set as pending after toggling
    data.internalStatus = 'pending';
    yield put(toggleApplicationStatusSuccess(data));
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

interface MetricValue {
  app: string;
  sum: number;
  max: number;
}

export function* fetchStatusMetrics(): SagaIterator {
  const baseUrl = yield select((state: RootState) => state.config.serviceUrls?.valueServiceApiUrl);
  const token: string = yield call(getAccessToken);

  yield take(FETCH_SERVICE_STATUS_APPS_SUCCESS_ACTION);

  if (baseUrl && token) {
    try {
      const apps: Record<string, ApplicationStatus> = (yield select(
        (state: RootState) => state.serviceStatus.applications
      )).reduce(
        (apps: Record<string, ApplicationStatus>, app: ApplicationStatus) => ({ ...apps, [app.appKey]: app }),
        {}
      );
      const criteria = JSON.stringify({
        intervalMax: moment().toISOString(),
        intervalMin: moment().subtract(7, 'day').toISOString(),
        metricLike: 'status-service',
      });

      const unhealthyMetric = 'status-service:application-unhealthy:count';
      const url = `${baseUrl}/value/v1/event-service/values/event/metrics?interval=weekly&criteria=${criteria}`;

      const metrics = (yield call(fetchStatusMetricsApi, url, token)) as Record<string, MetricResponse>;

      const downtimeDurations: MetricValue[] = [];
      Object.entries(metrics).forEach(([metric, durationMetric]) => {
        if (metric.endsWith('downtime:duration')) {
          const appId = metric.split(':')[1];
          const app = apps[appId]?.name;
          if (app) {
            downtimeDurations.push({
              app,
              sum: parseInt(durationMetric.values[0]?.sum || '0'),
              max: parseInt(durationMetric.values[0]?.max || '0'),
            });
          }
        }
      });

      const maxDuration = downtimeDurations.reduce((max, duration) => Math.max(duration.max, max), 0);
      const totalDuration = downtimeDurations.reduce((total, duration) => total + duration.sum, 0);
      const unhealthyApp = downtimeDurations.sort((a, b) => b.sum - a.sum)[0];
      const parsedMetrics = {
        unhealthyCount: parseInt(metrics[unhealthyMetric]?.values[0]?.sum || '0'),
        maxUnhealthyDuration: maxDuration / 60,
        totalUnhealthyDuration: totalDuration / 60,
        leastHealthyApp: unhealthyApp?.sum
          ? { name: unhealthyApp.app, totalUnhealthyDuration: unhealthyApp.sum / 60 }
          : null,
      };

      yield put(fetchStatusMetricsSucceeded(parsedMetrics));
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - fetchStatusMetrics` }));
    }
  }
}

export function* updateStatusContactInformation({ payload }: UpdateStatusContactInformationAction): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);

  if (configBaseUrl && token) {
    try {
      yield call(
        axios.patch,
        `${configBaseUrl}/configuration/v2/configuration/platform/status-service`,
        {
          operation: 'UPDATE',
          update: {
            contact: {
              contactEmail: payload.contactEmail,
            },
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      yield put(FetchStatusConfigurationService());
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - updateNotificationType` }));
    }
  }
}

export function* fetchStatusConfiguration(): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);

  if (configBaseUrl && token) {
    try {
      yield put(
        UpdateLoadingState({
          name: FETCH_STATUS_CONFIGURATION,
          state: 'start',
        })
      );
      const { data: configuration } = yield call(
        axios.get,
        `${configBaseUrl}/configuration/v2/configuration/platform/status-service`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const statusInfo = configuration.latest && configuration.latest.configuration;

      yield put(FetchStatusConfigurationSucceededService(statusInfo));

      yield put(
        UpdateLoadingState({
          name: FETCH_STATUS_CONFIGURATION,
          state: 'completed',
        })
      );
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - fetchStatusConfiguration` }));
      yield put(
        UpdateLoadingState({
          name: FETCH_STATUS_CONFIGURATION,
          state: 'error',
        })
      );
    }
  }
}

function getServiceStatusUrl(config: ConfigState): string {
  return config.serviceUrls.serviceStatusApiUrl;
}
