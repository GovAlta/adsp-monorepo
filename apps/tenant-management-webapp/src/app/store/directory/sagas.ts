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
import { DirectoryApi } from './api';
import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator } from '@store/session/actions';
import { adspId } from '@lib/adspId';
import { Service } from './models';

export function* fetchDirectory(action: FetchDirectoryAction): SagaIterator {
  const core = 'platform';
  const state: RootState = yield select();
  const token = state.session.credentials.token;
  const api = new DirectoryApi(state.config.tenantApi, token);
  const tenantName: string = yield select((state: RootState) => state.tenant.name);

  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading...',
    })
  );

  try {
    let tenantDirectory = [];
    const coreDirectory = yield call([api, api.fetchDirectoryTenant], core);

    if (tenantName.toLowerCase() !== core) {
      tenantDirectory = yield call([api, api.fetchDirectoryTenant], tenantName);

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

export function* createEntryDirectory(action: CreateEntryAction): SagaIterator {
  const state: RootState = yield select();
  const token = state.session.credentials.token;
  const api = new DirectoryApi(state.config.tenantApi, token);

  try {
    const sendEntry = {} as Service;

    sendEntry['service'] = action.data.api ? `${action.data.service}:${action.data.api}` : action.data.service;
    sendEntry['url'] = action.data.url;
    sendEntry['namespace'] = action.data.namespace;

    const result = yield call([api, api.createEntry], sendEntry);
    if (result) {
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
  const api = new DirectoryApi(state.config.tenantApi, token);

  try {
    const sendEntry = {} as Service;

    sendEntry['service'] = action.data.api ? `${action.data.service}:${action.data.api}` : action.data.service;
    sendEntry['url'] = action.data.url;
    sendEntry['namespace'] = action.data.namespace;
    sendEntry['_id'] = action.data._id;
    const result = yield call([api, api.updateEntry], action.data);
    if (result) {
      yield put(updateEntrySuccess(action.data));
    }
  } catch (err) {
    yield put(ErrorNotification({ message: `Failed to update service entry ${action.data.service} already exists.` }));
  }
}

export function* deleteEntryDirectory(action: DeleteEntryAction): SagaIterator {
  const state: RootState = yield select();
  const token = state.session.credentials.token;
  const api = new DirectoryApi(state.config.tenantApi, token);

  try {
    const result = yield call([api, api.deleteEntry], action.data);
    if (result) {
      yield put(deleteEntrySuccess(action.data));
    }
  } catch (err) {
    yield put(ErrorNotification({ message: `Failed to delete directory service entry ${action.data.service} ` }));
  }
}

export function* fetchEntryDetail(action: FetchEntryDetailAction): SagaIterator {
  const state: RootState = yield select();
  const token = state.session.credentials.token;
  const api = new DirectoryApi(state.config.tenantApi, token);

  try {
    const result = yield call([api, api.fetchEntryDetail], action.data);
    if (result) {
      const service = action.data;
      if (result.metadata) {
        service.metadata = result.metadata;
      } else {
        service.metadata = null;
      }

      yield put(fetchEntryDetailSuccess(service));
    }
  } catch (err) {
    const service = action.data;
    service.metadata = null;
    yield put(fetchEntryDetailSuccess(service));
  }
}

export function* fetchDirectoryByDetailURNs(action: FetchEntryDetailByURNsAction): SagaIterator {
  const state: RootState = yield select();
  const token = state.session.credentials.token;
  const api = new DirectoryApi(state.config.tenantApi, token);
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
            const result = yield call([api, api.fetchEntryDetail], _service);
            _service.metadata = result?.metadata ? { ...result?.metadata } : null;
            yield put(fetchEntryDetailSuccess(_service));
          }
          // eslint-disable-next-line
        } finally {
        }
      }
    }
  } catch (err) {
    yield put(ErrorNotification({ message: `Failed to fetch metadata by urns: ${err.message}` }));
  }
}
