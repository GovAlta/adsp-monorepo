import axios from 'axios';
import { put, select, call, takeEvery, takeLeading } from 'redux-saga/effects';
import { RootState } from '@store/index';
import { ErrorNotification } from '@store/notifications/actions';
import {
  FetchDirectoryAction,
  fetchDirectorySuccess,
  createEntrySuccess,
  updateEntrySuccess,
  deleteEntrySuccess,
  CreateEntryAction,
  UpdateEntryAction,
  DeleteEntryAction,
  FetchEntryDetailAction,
  fetchEntryDetailSuccess,
  FetchEntryDetailByURNsAction,
  FETCH_DIRECTORY,
  CREATE_ENTRY,
  UPDATE_ENTRY,
  DELETE_ENTRY,
  FETCH_ENTRY_DETAIL,
  FETCH_ENTRY_DETAIL_BY_URNS,
  FETCH_RESOURCE_TYPE,
  UPDATE_RESOURCE_TYPE,
  DELETE_RESOURCE_TYPE,
  fetchResourceTypeSuccessAction,
  updateResourceTypeSuccessAction,
  deleteResourceTypeSuccessAction,
  fetchResourceTypeInCoreSuccessAction,
} from './actions';
import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator, UpdateElementIndicator } from '@store/session/actions';
import { adspId } from '@lib/adspId';
import { Service } from './models';
import { toKebabName, replaceSpaceWithDash } from '@lib/kebabName';
import { getAccessToken } from '@store/tenant/sagas';
import { fetchResourceTypeApi } from './api';
export function* fetchDirectory(_action: FetchDirectoryAction): SagaIterator {
  const core = 'platform';
  const state: RootState = yield select();
  const token: string = yield call(getAccessToken);
  const tenantName: string = state.tenant.name ? state.tenant.name : core;
  const directoryBaseUrl: string = state.config.serviceUrls?.directoryServiceApiUrl;
  let tenantDirectoryData = [];

  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading...',
    })
  );
  if (directoryBaseUrl && token) {
    try {
      const { data: coreDirectory } = yield call(
        axios.get,
        `${directoryBaseUrl}/directory/v2/namespaces/${toKebabName(core)}/entries`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // if its our core Platform tenant then don't make this call
      if (tenantName !== 'Platform') {
        const { data: tenantDirectory } = yield call(
          axios.get,
          `${directoryBaseUrl}/directory/v2/namespaces/${replaceSpaceWithDash(tenantName)}/entries`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        tenantDirectoryData = tenantDirectory;
      }

      yield put(fetchDirectorySuccess([...tenantDirectoryData, ...coreDirectory]));

      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ message: 'Failed to fetch directory service', error: err }));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    }
  }
}

export function* createEntryDirectory(action: CreateEntryAction): SagaIterator {
  const state: RootState = yield select();
  const token = yield call(getAccessToken);
  const directoryBaseUrl: string = state.config.serviceUrls?.directoryServiceApiUrl;
  const tenantName: string = state.tenant.name;
  const servicesUrl = `${directoryBaseUrl}/directory/v2/namespaces/${replaceSpaceWithDash(tenantName)}/services`;
  try {
    const sendEntry = { url: action.data.url } as Service;
    let url: string = null;

    if (action.data.api) {
      sendEntry.api = action.data.api;
      url = `${servicesUrl}/${action.data.service}/apis`;
    } else {
      sendEntry.service = action.data.service;
      url = servicesUrl;
    }

    const { data } = yield call(
      axios.post,
      url,
      { ...sendEntry },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (data) {
      yield put(createEntrySuccess(action.data));
    }
  } catch (err) {
    yield put(
      ErrorNotification({
        message: `Failed to create a directory service entry,  ${action.data.service} already exists.`,
      })
    );
  }
}

export function* updateEntryDirectory(action: UpdateEntryAction): SagaIterator {
  const state: RootState = yield select();
  const token = yield call(getAccessToken);
  const directoryBaseUrl: string = state.config.serviceUrls?.directoryServiceApiUrl;
  const tenantName: string = state.tenant.name;
  const servicesUrl = `${directoryBaseUrl}/directory/v2/namespaces/${replaceSpaceWithDash(tenantName)}/services/${
    action.data.service
  }`;

  try {
    const sendEntry = { url: action.data.url } as Service;
    const url = action.data.api ? `${servicesUrl}/apis/${action.data.api}` : servicesUrl;
    if (action.data.api) {
      sendEntry.api = action.data.api;
    } else {
      sendEntry.service = action.data.service;
    }

    const { data } = yield call(
      axios.patch,
      url,
      { ...sendEntry },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (data === 'Created') {
      yield put(updateEntrySuccess(action.data));
    }
  } catch (err) {
    yield put(ErrorNotification({ message: 'Failed to update service', error: err }));
  }
}

export function* deleteEntryDirectory(action: DeleteEntryAction): SagaIterator {
  const state: RootState = yield select();
  const token = yield call(getAccessToken);
  const directoryBaseUrl: string = state.config.serviceUrls?.directoryServiceApiUrl;
  const tenantName: string = state.tenant.name;
  const servicesUrl = `${directoryBaseUrl}/directory/v2/namespaces/${replaceSpaceWithDash(tenantName)}/services/${
    action.data.service
  }`;
  const url = action.data.api ? `${servicesUrl}/apis/${action.data.api}` : servicesUrl;

  try {
    const { data } = yield call(axios.delete, url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (data === 'OK') {
      yield put(deleteEntrySuccess(action.data));
    }
  } catch (err) {
    yield put(ErrorNotification({ message: 'Failed to delete directory service entry', error: err }));
  }
}

export function* fetchEntryDetail(action: FetchEntryDetailAction): SagaIterator {
  const state: RootState = yield select();
  const token = yield call(getAccessToken);
  const directoryBaseUrl: string = state.config.serviceUrls?.directoryServiceApiUrl;

  yield put(
    UpdateElementIndicator({
      show: true,
      id: action.data.urn,
    })
  );

  try {
    const { data } = yield call(
      axios.get,
      `${directoryBaseUrl}/directory/v2/namespaces/${replaceSpaceWithDash(action.data.namespace)}/services/${
        action.data.service
      }`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (data) {
      const service = action.data;
      service.loaded = true;
      if (data.metadata) {
        service.metadata = data.metadata;
      } else {
        service.metadata = null;
      }

      yield put(fetchEntryDetailSuccess(service));
    }
  } catch (err) {
    const service = action.data;
    service.loaded = true;
    service.metadata = null;
    yield put(fetchEntryDetailSuccess(service));
  }
  yield put(
    UpdateElementIndicator({
      show: false,
    })
  );
}

export function* fetchDirectoryByDetailURNs(action: FetchEntryDetailByURNsAction): SagaIterator {
  const state: RootState = yield select();
  const token = yield call(getAccessToken);
  const directoryBaseUrl: string = state.config.serviceUrls?.directoryServiceApiUrl;
  const tenantName: string = state.tenant.name;
  const directoryUpdateList = state.directory.directory;

  try {
    for (const urn of action.payload) {
      const id = adspId`${urn}`;
      if (id.type === 'service') {
        try {
          const _service = {
            service: id.service,
            namespace: id.namespace,
          } as Service;

          const existed = directoryUpdateList.find((x) => x.service === _service?.service);
          if (!(existed && existed.metadata)) {
            // fetch metadata from remote only when it does not exist
            const { data: result } = yield call(
              axios.get,
              `${directoryBaseUrl}/directory/v2/namespaces/${replaceSpaceWithDash(tenantName)}/services/${
                _service.service
              }`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            _service.metadata = result?.metadata ? { ...result?.metadata } : null;
            yield put(fetchEntryDetailSuccess(_service));
          }
          // eslint-disable-next-line
        } catch (err) {
          console.warn(`Failed to fetch metadata ${err.message}`);
        }
      }
    }
  } catch (err) {
    yield put(ErrorNotification({ message: 'Failed to fetch metadata by urns', error: err }));
  }
}

export function* fetchResourceTypes(): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);

  if (configBaseUrl && token) {
    try {
      const url = `${configBaseUrl}/configuration/v2/configuration/platform/directory-service/latest`;
      const urlInCore = `${configBaseUrl}/configuration/v2/configuration/platform/directory-service/latest?core`;

      const { resourceType } = yield call(fetchResourceTypeApi, token, url);
      const resourceTypesInCore = yield call(fetchResourceTypeApi, token, urlInCore);
      yield put(
        UpdateIndicator({
          show: true,
        })
      );

      yield put(
        UpdateIndicator({
          show: false,
        })
      );
      yield put(fetchResourceTypeSuccessAction(resourceType));
      yield put(fetchResourceTypeInCoreSuccessAction(resourceTypesInCore));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    }
  }
}

export function* updateResourceType(payload): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield call(getAccessToken);
  const resourceType = { [payload.urn]: payload.resourceType };
  if (baseUrl && token) {
    try {
      const {
        data: { latest },
      } = yield call(
        axios.patch,
        `${baseUrl}/configuration/v2/configuration/platform/directory-service`,
        {
          operation: 'UPDATE',
          update: { resourceType },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      yield put(
        updateResourceTypeSuccessAction({
          ...latest.configuration?.resourceType,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}
export function* deleteResourceType(payload): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield call(getAccessToken);
  const currentResourceTypes = yield select((state: RootState) => state.directory.resourceType);
  if (Object.prototype.hasOwnProperty.call(currentResourceTypes, payload.urn)) {
    delete currentResourceTypes[payload.urn];
  }

  if (baseUrl && token) {
    try {
      const {
        data: { latest },
      } = yield call(
        axios.patch,
        `${baseUrl}/configuration/v2/configuration/platform/directory-service`,
        {
          operation: 'REPLACE',
          configuration: { resourceType: currentResourceTypes },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      yield put(
        deleteResourceTypeSuccessAction({
          ...latest.configuration?.resourceType,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* watchDirectorySagas(): Generator {
  yield takeEvery(FETCH_DIRECTORY, fetchDirectory);
  yield takeEvery(CREATE_ENTRY, createEntryDirectory);
  yield takeEvery(UPDATE_ENTRY, updateEntryDirectory);
  yield takeEvery(DELETE_ENTRY, deleteEntryDirectory);
  yield takeEvery(FETCH_ENTRY_DETAIL, fetchEntryDetail);
  yield takeEvery(FETCH_RESOURCE_TYPE, fetchResourceTypes);
  yield takeEvery(UPDATE_RESOURCE_TYPE, updateResourceType);
  yield takeEvery(DELETE_RESOURCE_TYPE, deleteResourceType);
  yield takeLeading(FETCH_ENTRY_DETAIL_BY_URNS, fetchDirectoryByDetailURNs);
}
