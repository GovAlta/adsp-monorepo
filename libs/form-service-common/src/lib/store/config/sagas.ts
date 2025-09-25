import axios from 'axios';
import { put, select, call } from 'redux-saga/effects';
import { RootState } from '../index';
import { ErrorNotification } from '../notifications/actions';
import { FetchConfigSuccessAction } from './actions';
import { SagaIterator } from '@redux-saga/core';

export function* fetchConfigSaga(): SagaIterator {
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

        fileApi: {
          host: entryMapping['file-service'],
          endpoints: {
            fileAdmin: '/file/v1/files',
          },
        },
        serviceUrls: {
          fileApi: entryMapping['file-service'],
          valueServiceApiUrl: entryMapping['value-service'],
          configurationServiceApiUrl: entryMapping['configuration-service'],
          directoryServiceApiUrl: entryMapping['directory-service'],
          pdfServiceApiUrl: entryMapping['pdf-service'],
          pushServiceApiUrl: entryMapping['push-service'],
          calendarServiceApiUrl: entryMapping['calendar-service'],
          formServiceApiUrl: data.serviceUrls.formServiceUrl,
          exportServiceUrl: entryMapping['export-service'],
        },
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
        type: 'form-service-common/config/fetch-config-success',
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
