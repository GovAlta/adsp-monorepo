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
      const directoryServiceUrl = data.serviceUrls.directoryServiceApiUrl;
      const url = `${directoryServiceUrl}/directory/v2/namespaces/platform/entries`;
      const entries = (yield call(axios.get, url)).data;
      const entryMapping = {};
      entries.forEach((entry) => {
        entryMapping[entry.service] = entry.url;
      });
      const tenantWebConfig = {
        keycloakApi: {
          ...data.keycloakApi,
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
        },
      };
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
