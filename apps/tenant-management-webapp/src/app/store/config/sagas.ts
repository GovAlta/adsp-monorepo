import axios from 'axios';
import { put } from 'redux-saga/effects';
import { ErrorNotification } from '../../store/notifications/actions';
import { FetchConfigAction, FetchConfigSuccessAction } from './actions';
import { KeycloakApi, ServiceUrls, TenantApi } from './models';

const http = axios.create();

async function fetchServiceConfig(): Promise<ServiceUrls> {
  const res = await http.get('/config/config.json');
  return res.data as ServiceUrls;
}

async function fetchKeycloakApi(): Promise<KeycloakApi> {
  return Promise.resolve({
    realm: 'core',
    url: 'https://access-dev.os99.gov.ab.ca/auth',
    clientId: 'tenant-admin-frontend-qa',
    checkLoginIframe: false,
  });
}

async function fetchTenantApi(): Promise<TenantApi> {
  return Promise.resolve({
    host: 'https://tenant-management-api-core-services-dev.os99.gov.ab.ca',
    endpoints: {
      spaceAdmin: '/api/file/v1/space',
      realmByTenantId: '/api/realm/v1',
      tenantNameByRealm: '/api/tenant/v1/realm',
    },
  });
}

export function* fetchConfig(params: FetchConfigAction) {
  // TODO: some of this data is hardcoded for now, fetch from api later
  // TODO: do the same thing here as was done with the tenant-managment api setup
  try {
    const serviceUrls = yield fetchServiceConfig();
    const keycloakApi = yield fetchKeycloakApi();
    const tenantApi = yield fetchTenantApi();

    const action: FetchConfigSuccessAction = {
      type: 'config/fetch-config-success',
      payload: {
        keycloakApi,
        tenantApi,
        serviceUrls,
      },
    };

    yield put(action);
  } catch (e) {
    yield put(ErrorNotification({ message: e.message }));
  }
}
