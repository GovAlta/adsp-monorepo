import axios from 'axios';
import { put, select, call } from 'redux-saga/effects';
import { RootState } from '@store/index';
import { ErrorNotification } from '@store/notifications/actions';
import { FetchConfigSuccessAction } from './actions';
import { SagaIterator } from '@redux-saga/core';

export function* fetchConfig(): SagaIterator {
  const state: RootState = yield select();

  try {
    if (!state.config?.keycloakApi?.realm) {
      const { data } = yield call(axios.get, `/config/config.json?v=2`);
      const directoryServiceUrl = getDirectoryServiceUrl(data);
      const url = `${directoryServiceUrl}/directory/v2/namespaces/platform/entries`;
      const entries = (yield call(axios.get, url)).data;
      const entryMapping = {};
      entries.forEach((entry) => {
        entryMapping[entry.service] = entry.url;
      });

      const tenantWebConfig: Record<string, unknown> = {
        keycloakApi: {
          ...data.keycloakApi,
          url: getKeycloakUrl(data),
          silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        },
        tenantApi: {
          host: entryMapping['tenant-service'],
          endpoints: {
            spaceAdmin: '/api/file/v1/space',
            createTenant: '/api/tenant/v1',
            tenantNameByRealm: '/api/tenant/v1/realm',
            tenantByName: '/api/tenant/v1/name',
            tenantByEmail: '/api/tenant/v1/email',
            tenantConfig: '/api/configuration/v1/tenantConfig',
          },
        },
        fileApi: {
          host: entryMapping['file-service'],
          endpoints: {
            spaceAdmin: '/space/v1/spaces',
            fileTypeAdmin: '/file-type/v1/fileTypes',
            fileAdmin: '/file/v1/files',
          },
        },
        serviceUrls: {
          eventServiceApiUrl: entryMapping['event-service'],
          notificationServiceUrl: entryMapping['notification-service'],
          keycloakUrl: entryMapping['access-service'],
          tenantManagementApi: entryMapping['tenant-service'],
          subscriberWebApp: entryMapping['subscriber-app'],
          taskWebApp: entryMapping['task-app'],
          accessManagementApi: `${entryMapping['access-service']}/auth`,
          fileApi: entryMapping['file-service'],
          serviceStatusApiUrl: entryMapping['status-service'],
          valueServiceApiUrl: entryMapping['value-service'],
          serviceStatusAppUrl: entryMapping['status-app'],
          docServiceApiUrl: entryMapping['api-doc-service'],
          configurationServiceApiUrl: entryMapping['configuration-service'],
          directoryServiceApiUrl: entryMapping['directory-service'],
          pdfServiceApiUrl: entryMapping['pdf-service'],
          pushServiceApiUrl: entryMapping['push-service'],
          tenantManagementWebApp: entryMapping['tenant-app'],
          calendarServiceApiUrl: entryMapping['calendar-service'],
          uiComponentUrl: data.serviceUrls.uiComponentUrl,
          chatServiceApiUrl: data.serviceUrls.chatServiceApiUrl,
          scriptServiceApiUrl: entryMapping['script-service'],
          taskServiceApiUrl: entryMapping['task-service'],
          commentServiceApiUrl: entryMapping['comment-service'],
          feedbackServiceUrl: entryMapping['feedback-service'],
          formServiceApiUrl: data.serviceUrls.formServiceUrl,
          exportServiceUrl: entryMapping['export-service'],
          formAppApiUrl: entryMapping['form-service'],
          agentServiceApiUrl: entryMapping['agent-service'],
        },
        featureFlags: data.featureFlags,
      };

      const feedbackServiceUrl = entryMapping['feedback-service'];
      if (feedbackServiceUrl) {
        const { integrity }: { integrity: string } = (yield call(
          axios.get,
          new URL('/feedback/v1/script/integrity', feedbackServiceUrl).href
        )).data;

        // Set the feedback script information.
        // Include a portion of the integrity value for cache busting; the integrity endpoint doesn't apply cache-control header.
        tenantWebConfig.feedback = {
          script: {
            src: new URL(`/feedback/v1/script/adspFeedback.js?${integrity.substring(40)}`, feedbackServiceUrl),
            integrity,
          },
          tenant: data.feedback?.tenant || 'autotest',
        };
      }

      const action: FetchConfigSuccessAction = {
        type: 'config/fetch-config-success',
        payload: tenantWebConfig,
      };
      yield put(action);
    }
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}

// You can override the directory_url by setting NX_DIRECTORY_URL (e.g. for testing locally)
// via the .local.env file in the app root.
const getDirectoryServiceUrl = (data): string => {
  return process.env.NX_DIRECTORY_URL ? process.env.NX_DIRECTORY_URL : data.serviceUrls.directoryServiceApiUrl;
};

// You can override the directory_url by setting NX_DIRECTORY_URL (e.g. for testing locally)
// via the .local.env file in the app root.
const getKeycloakUrl = (data): string => {
  return process.env.NX_KEYCLOAK_URL ? process.env.NX_KEYCLOAK_URL : data.keycloakApi.url;
};
