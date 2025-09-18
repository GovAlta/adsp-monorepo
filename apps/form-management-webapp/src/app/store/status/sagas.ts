import { SagaIterator } from '@redux-saga/core';
import { RootState } from '@store/index';
import { ErrorNotification } from '@store/notifications/actions';
import { fetchServiceMetrics } from '@store/common';
import { ConfigState } from '@store/config/models';
import { ResetModalState, UpdateLoadingState, UpdateIndicator } from '@store/session/actions';
import { getAccessToken } from '@store/tenant/sagas';
import axios from 'axios';
import { put, select, call } from 'redux-saga/effects';
import { StatusApi, WebhookApi } from './api';
import {
  SaveApplicationAction,
  saveApplicationSuccess,
  fetchServiceStatusAppsSuccess,
  fetchServiceStatusApps as refreshServiceStatusApps,
  DeleteApplicationAction,
  deleteApplicationSuccess,
  ToggleApplicationStatusAction,
  fetchServiceStatusAppHealthSuccess,
  fetchServiceAllStatusAppHealthSuccess,
  fetchServiceStatusAppHealth,
  fetchStatusMetricsSucceeded,
  FETCH_STATUS_CONFIGURATION,
  UpdateStatusContactInformationAction,
  FetchStatusConfigurationService,
  FetchStatusConfigurationSucceededService,
  toggleApplicationStatusSuccess,
  FETCH_SERVICE_STATUS_APPS_ACTION,
  saveWebhookAction,
  fetchWebhooksSuccess,
  TestWebhooksSuccess,
  deleteWebhookSuccess,
  DeleteWebhookAction,
  SaveWebhookSuccess,
  TestWebhookAction,
} from './actions';
import { SetApplicationStatusAction, setApplicationStatusSuccess } from './actions/setApplicationStatus';
import { EndpointStatusEntry, ApplicationStatus, Webhooks, ApplicationWebhooks } from './models';

export function* fetchServiceStatusAppHealthEffect(api: StatusApi, application: ApplicationStatus): SagaIterator {
  try {
    yield put(fetchServiceStatusAppHealth(application.appKey));
    const entryMap: EndpointStatusEntry[] = yield call([api, api.getEndpointStatusEntries], application.appKey);
    application.endpoint.statusEntries = entryMap;
    yield put(fetchServiceStatusAppHealthSuccess(application.appKey, application.endpoint.url, entryMap));
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  }
}

export function* fetchAllServiceStatusAppHealthEffect(api: StatusApi): SagaIterator {
  try {
    const entryMap: EndpointStatusEntry[] = yield call([api, api.getAllEndpointStatusEntries]);

    yield put(fetchServiceAllStatusAppHealthSuccess(entryMap));
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
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

    yield call(fetchAllServiceStatusAppHealthEffect, api);

    yield put(fetchServiceStatusAppsSuccess(applications));
    yield put(
      UpdateLoadingState({
        name: FETCH_SERVICE_STATUS_APPS_ACTION,
        state: 'completed',
      })
    );
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
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
  const existingApp = statusApplications.filter((app) => app.appKey === action.payload.appKey);

  const baseUrl = getServiceStatusUrl(currentState.config);
  const token = yield call(getAccessToken);
  try {
    const api = new StatusApi(baseUrl, token);
    let data;

    if (existingApp.length === 1) {
      data = yield call([api, api.updateApplication], action.payload);
    } else {
      data = yield call([api, api.saveApplication], action.payload);
    }
    yield put(saveApplicationSuccess(data));
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  }
}

export function* saveWebhook(action: saveWebhookAction): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Saving webhook changes...',
    })
  );
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);

  const token = yield call(getAccessToken);
  try {
    const api = new WebhookApi(baseUrl, token);
    const statusData = yield call([api, api.fetchWebhookStatus]);

    const hookIntervals = statusData?.latest?.configuration.applicationWebhookIntervals;

    const { name, url, targetId, eventTypes, intervalMinutes, id, description } = action.payload;

    const pushService: Record<string, Webhooks> = {
      [id]: {
        id: id,
        name: name,
        url: url,
        targetId: targetId,
        description: description,
        eventTypes: eventTypes,
      },
    };

    const statusService: ApplicationWebhooks = {
      applicationWebhookIntervals: {
        ...hookIntervals,
        [targetId]: {
          appId: targetId,
          waitTimeInterval: intervalMinutes,
        },
      },
    };

    const data = yield call([api, api.saveWebhookPush], pushService);
    const statusDataResponse = yield call([api, api.saveWebhookStatus], statusService);

    const hookIntervalResponse = statusDataResponse?.latest?.configuration.applicationWebhookIntervals;

    yield put(SaveWebhookSuccess(data.latest.configuration?.webhooks, hookIntervalResponse));
    yield put(ResetModalState());
    yield put(
      UpdateIndicator({
        show: false,
      })
    );
    yield put(refreshServiceStatusApps());
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  }
}

export function* fetchWebhook(_action: saveWebhookAction): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );

  const token = yield call(getAccessToken);
  try {
    const api = new WebhookApi(configBaseUrl, token);

    const data = yield call([api, api.fetchWebhookPush]);

    const statusData = yield call([api, api.fetchWebhookStatus]);

    const configuration = data?.latest?.configuration?.webhooks;
    const hookIntervals = statusData?.latest?.configuration.applicationWebhookIntervals;

    yield put(fetchWebhooksSuccess(configuration, hookIntervals));
    yield put(refreshServiceStatusApps());
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
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
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  }
}

export function* deleteWebhook(action: DeleteWebhookAction): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token = yield call(getAccessToken);

  const id = action.payload.id;

  try {
    const api = new WebhookApi(configBaseUrl, token);
    yield call([api, api.deleteWebhook], id);

    yield put(deleteWebhookSuccess(action.payload.id));
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  }
}
export function* testWebhook(action: TestWebhookAction): SagaIterator {
  const currentState: RootState = yield select();

  const token = yield call(getAccessToken);
  const statusServiceUrl = getServiceStatusUrl(currentState.config);

  yield put(
    UpdateIndicator({
      show: true,
      message: 'Running test...',
    })
  );

  try {
    const api = new StatusApi(statusServiceUrl, token);

    const response = yield call([api, api.testWebhook], action.webhook, action.eventName); // webhook: Webhooks, eventName

    yield put(
      UpdateIndicator({
        show: false,
      })
    );

    yield put(TestWebhooksSuccess(response));
  } catch (err) {
    yield put(
      UpdateIndicator({
        show: false,
      })
    );
    yield put(ErrorNotification({ error: err }));
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
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
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
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  }
}

interface MetricValue {
  app: string;
  sum: number;
  max: number;
}

export function* fetchStatusMetrics(): SagaIterator {
  const apps = (yield select((state: RootState) => state.serviceStatus.applications)).reduce(
    (apps, app: ApplicationStatus) => ({ ...apps, [app.appKey]: app }),
    {} as Record<string, ApplicationStatus>
  );

  yield* fetchServiceMetrics('status-service', function* (metrics) {
    const unhealthyMetric = 'status-service:application-unhealthy:count';

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
  });
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
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
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
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
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
