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
      const tenantWebConfig = {
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
        },
      };
      // const { data } = yield call(axios.get, `/config/config.json?v=2`);
      // console.log(JSON.stringify(data) + '<datadatadata');
      // const directoryServiceUrl = data.serviceUrls.directoryServiceApiUrl;
      // const url = `${directoryServiceUrl}/directory/v2/namespaces/platform/entries`;
      // const entries = (yield call(axios.get, url)).data;
      // const entryMapping = {};
      // entries.forEach((entry) => {
      //   entryMapping[entry.service] = entry.url;
      // });
      // const tenantWebConfig = {
      //   keycloakApi: {
      //     ...data.keycloakApi,
      //     silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      //   },
      //   tenantApi: {
      //     host: entryMapping['tenant-service'],
      //     endpoints: {
      //       spaceAdmin: '/api/file/v1/space',
      //       createTenant: '/api/tenant/v1',
      //       tenantNameByRealm: '/api/tenant/v1/realm',
      //       tenantByName: '/api/tenant/v1/name',
      //       tenantByEmail: '/api/tenant/v1/email',
      //       tenantConfig: '/api/configuration/v1/tenantConfig',
      //     },
      //   },
      //   fileApi: {
      //     host: entryMapping['file-service'],
      //     endpoints: {
      //       spaceAdmin: '/space/v1/spaces',
      //       fileTypeAdmin: '/file-type/v1/fileTypes',
      //       fileAdmin: '/file/v1/files',
      //     },
      //   },
      //   serviceUrls: {
      //     eventServiceApiUrl: entryMapping['event-service'],
      //     notificationServiceUrl: entryMapping['notification-service'],
      //     keycloakUrl: entryMapping['access-service'],
      //     tenantManagementApi: entryMapping['tenant-service'],
      //     subscriberWebApp: entryMapping['subscriber-app'],
      //     accessManagementApi: `${entryMapping['access-service']}/auth`,
      //     fileApi: entryMapping['file-service'],
      //     serviceStatusApiUrl: entryMapping['status-service'],
      //     valueServiceApiUrl: entryMapping['value-service'],
      //     serviceStatusAppUrl: entryMapping['status-app'],
      //     docServiceApiUrl: entryMapping['api-doc-service'],
      //     configurationServiceApiUrl: entryMapping['configuration-service'],
      //     directoryServiceApiUrl: entryMapping['directory-service'],
      //     pdfServiceApiUrl: entryMapping['pdf-service'],
      //     pushServiceApiUrl: entryMapping['push-service'],
      //     tenantManagementWebApp: entryMapping['tenant-app'],
      //     calendarServiceApiUrl: entryMapping['calendar-service'],
      //     uiComponentUrl: data.serviceUrls.uiComponentUrl,
      //     chatServiceApiUrl: data.serviceUrls.chatServiceApiUrl,
      //     scriptServiceApiUrl: entryMapping['script-service'],
      //   },
      // };

      const res = yield call(axios.get, `/config/config.json?v=2`);

      res.data.serviceUrls.tenantManagementApi = 'http://localhost:3333';
      res.data.serviceUrls.fileApi = 'http://localhost:3337';
      res.data.tenantApi.host = 'http://localhost:3333';
      res.data.fileApi.host = 'http://localhost:3337';
      res.data.serviceUrls.serviceStatusApiUrl = 'http://localhost:3338';
      res.data.serviceUrls.configurationServiceApiUrl = 'http://localhost:3339';
      res.data.serviceUrls.serviceStatusAppUrl = 'http://localhost:4444';
      res.data.serviceUrls.notificationServiceUrl = 'http://localhost:3335';
      res.data.serviceUrls.valueServiceApiUrl = 'http://localhost:3336';
      res.data.serviceUrls.eventServiceApiUrl = 'http://localhost:3334';
      res.data.serviceUrls.keycloakUrl = 'https://access.adsp-dev.gov.ab.ca';
      res.data.keycloakApi.url = 'https://access.adsp-dev.gov.ab.ca/auth';
      res.data.tenantApi.endpoints.directory = '/api/directory/v2/namespaces/platform';
      res.data.serviceUrls.subscriberWebApp = 'http://localhost:4445';
      res.data.serviceUrls.pdfServiceApiUrl = 'http://localhost:3345';
      res.data.serviceUrls.pushServiceApiUrl = 'http://localhost:3341';
      res.data.serviceUrls.directoryServiceApiUrl = 'http://localhost:3331';
      res.data.serviceUrls.scriptServiceApiUrl = 'http://localhost:5206';
      res.data.serviceUrls.tenantManagementWebApp = 'http://localhost:4200';
      res.data.serviceUrls.accessManagementApi = 'https://access.adsp-dev.gov.ab.ca';

      console.log(JSON.stringify(res.data) + '<res.data');

      const action: FetchConfigSuccessAction = {
        type: 'config/fetch-config-success',
        payload: res.data,
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
