import axios from 'axios';
import { put, select, call } from 'redux-saga/effects';
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
} from './actions';

import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator, UpdateElementIndicator } from '@store/session/actions';
import { adspId } from '@lib/adspId';
import { Service } from './models';
import { toKebabName } from '@lib/kebabName';

export function* fetchDirectory(action: FetchDirectoryAction): SagaIterator {
  const core = 'platform';
  const state: RootState = yield select();
  const token: string = state.session.credentials.token;
  const tenantName: string = state.tenant.name;
  const directoryBaseUrl: string = state.config.serviceUrls?.directoryServiceApiUrl;

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

      if (tenantName.toLowerCase() !== core) {
        const { data: tenantDirectory } = yield call(
          axios.get,
          `${directoryBaseUrl}/directory/v2/namespaces/${toKebabName(tenantName)}/entries`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        yield put(fetchDirectorySuccess({ directory: [...tenantDirectory, ...coreDirectory] }));
      } else {
        yield put(fetchDirectorySuccess({ directory: coreDirectory }));
      }

      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    } catch (e) {
      yield put(ErrorNotification({ message: 'Failed to fetch directory service' }));
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
  const token = state.session.credentials.token;
  const directoryBaseUrl: string = state.config.serviceUrls?.directoryServiceApiUrl;
  const tenantName: string = state.tenant.name;
  try {
    const sendEntry = {} as Service;

    sendEntry.service = action.data.api ? `${action.data.service}:${action.data.api}` : action.data.service;
    sendEntry.url = action.data.url;
    sendEntry.namespace = action.data.namespace;

    const { data } = yield call(
      axios.post,
      `${directoryBaseUrl}/directory/v2/namespaces/${toKebabName(tenantName)}`,
      { ...sendEntry },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (data) {
      action.data['_id'] = data._id;
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
  const token = state.session.credentials.token;
  const directoryBaseUrl: string = state.config.serviceUrls?.directoryServiceApiUrl;
  const tenantName: string = state.tenant.name;

  try {
    const sendEntry = {} as Service;

    sendEntry.service = action.data.api ? `${action.data.service}:${action.data.api}` : action.data.service;
    sendEntry.url = action.data.url;
    sendEntry.namespace = action.data.namespace;
    sendEntry._id = action.data._id;
    const { data } = yield call(
      axios.put,
      `${directoryBaseUrl}/directory/v2/namespaces/${toKebabName(tenantName)}`,
      { ...sendEntry },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (data === 'Created') {
      yield put(updateEntrySuccess(action.data));
    }
  } catch (err) {
    yield put(ErrorNotification({ message: `Failed to update service entry ${action.data.service} already exists.` }));
  }
}

export function* deleteEntryDirectory(action: DeleteEntryAction): SagaIterator {
  const state: RootState = yield select();
  const token = state.session.credentials.token;
  const directoryBaseUrl: string = state.config.serviceUrls?.directoryServiceApiUrl;
  const tenantName: string = state.tenant.name;

  const service = action.data.api ? `${action.data.service}:${action.data.api}` : action.data.service;

  try {
    const { data } = yield call(
      axios.delete,
      `${directoryBaseUrl}/directory/v2/namespaces/${toKebabName(tenantName)}/services/${service}`,

      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (data === 'OK') {
      yield put(deleteEntrySuccess(action.data));
    }
  } catch (err) {
    yield put(ErrorNotification({ message: `Failed to delete directory service entry ${action.data.service} ` }));
  }
}

export function* fetchEntryDetail(action: FetchEntryDetailAction): SagaIterator {
  const state: RootState = yield select();
  const token = state.session.credentials.token;
  const directoryBaseUrl: string = state.config.serviceUrls?.directoryServiceApiUrl;

  yield put(
    UpdateElementIndicator({
      show: true,
    })
  );

  try {
    const { data } = yield call(
      axios.get,
      `${directoryBaseUrl}/directory/v2/namespaces/${toKebabName(action.data.namespace)}/services/${
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
  const token = state.session.credentials.token;
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
              `${directoryBaseUrl}/directory/v2/namespaces/${toKebabName(tenantName)}/services/${_service.service}`,
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
    yield put(ErrorNotification({ message: `Failed to fetch metadata by urns: ${err.message}` }));
  }
}
