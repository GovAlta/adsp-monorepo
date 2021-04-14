import { put, select } from 'redux-saga/effects';

import { ErrorNotification } from '@store/notifications/actions';
import { FetchFileSpaceSuccess, CreateFileSpaceSucceededService, CreateFileSpaceFailedService } from './actions';
import axios from 'axios';
import { RootState } from '@store/index';
import { FileApi } from './api';
import {
  FetchFileTypeSucceededService,
  DeleteFileTypeSucceededService,
  CreateFileTypeSucceededService,
  UpdateFileTypeSucceededService,
} from './actions';

export function* fetchSpace() {
  const state: RootState = yield select();

  const token = state.session.credentials.token;
  const api = new FileApi(state.config.tenantApi, token);
  const { clientId, realm } = state.session;

  try {
    const file = yield api.fetchSpace(clientId, realm);
    yield put(FetchFileSpaceSuccess({ data: file }));
  } catch (e) {
    yield put(ErrorNotification({ message: 'failed to fetch space' }));
  }
}

export function* fileEnable(fileType) {
  const state = yield select();
  const fileApi = state.config.serviceUrls.fileApi;
  const user = state.session.userInfo;
  const url = `${fileApi}/space/v1/spaces`;
  const token = state.session.credentials.token;

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const spaceId = state.tenant.name || state.session.userInfo.email;

  const data = {
    spaceId: spaceId,
    name: `${spaceId} space`,
    spaceAdminRole: 'uma_authorization',
  };

  try {
    const fileTypes = axios.put(url, data, { headers: headers });
    const fileTypeInfo = yield fileTypes;
    yield put(CreateFileSpaceSucceededService(fileTypeInfo));
  } catch (e) {
    yield put(CreateFileSpaceFailedService(e.message));
  }
}

export function* fetchFileTypes(config) {
  const state = yield select();
  const fileApi = state.config.serviceUrls.fileApi;
  const url = `${fileApi}/file-type/v1/fileTypes`;
  const token = state.session.credentials.token;
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  if (state.file === undefined || state.file.space === undefined) {
    return yield put(ErrorNotification({ message: 'no file space' }));
  }

  const data = {
    spaceId: state.file.space.id,
  };
  try {
    const fileTypes = axios.get(url, { params: data, headers: headers });
    const fileTypeInfo = yield fileTypes;
    yield put(FetchFileTypeSucceededService(fileTypeInfo));
  } catch (e) {
    yield put(ErrorNotification({ message: `${e.message} - ${url}` }));
  }
}

export function* deleteFileTypes(fileType) {
  const state = yield select();
  const fileApi = state.config.serviceUrls.fileApi;

  const url = `${fileApi}/file-type/v1/fileTypes/${fileType.payload.fileInfo.id}`;
  const token = state.session.credentials.token;

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  try {
    const fileTypes = axios.delete(url, { headers: headers });
    yield fileTypes;
    yield put(DeleteFileTypeSucceededService(fileType.payload.fileInfo));
  } catch (e) {
    yield put(ErrorNotification({ message: `${e.message} - ${url}` }));
  }
}

export function* createFileType(fileType) {
  const state = yield select();
  const fileApi = state.config.serviceUrls.fileApi;
  const url = `${fileApi}/file-type/v1/fileTypes`;
  const token = state.session.credentials.token;

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const readRolesArray = fileType.payload.fileInfo.readRoles ? fileType.payload.fileInfo.readRoles.split(',') : [];
  const updateRolesArray = fileType.payload.fileInfo.updateRoles
    ? fileType.payload.fileInfo.updateRoles.split(',')
    : [];

  const data = {
    spaceId: state.file.space.id,
    name: fileType.payload.fileInfo.name,
    anonymousRead: true,
    readRoles: readRolesArray,
    updateRoles: updateRolesArray,
  };

  try {
    const fileTypes = axios.post(url, data, { headers: headers });
    const fileTypeInfo = yield fileTypes;
    yield put(CreateFileTypeSucceededService(fileTypeInfo));
  } catch (e) {
    yield put(ErrorNotification({ message: `${e.message} - ${url}` }));
  }
}

export function* updateFileType(fileType) {
  const state = yield select();
  const fileApi = state.config.serviceUrls.fileApi;

  const url = `${fileApi}/file-type/v1/fileTypes/${fileType.payload.fileInfo.id}`;
  const token = state.session.credentials.token;

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const data = {
    spaceId: state.file.space.id,
    name: fileType.payload.fileInfo.name,
    anonymousRead: fileType.payload.fileInfo.anonymousRead,
    readRoles: fileType.payload.fileInfo.readRoles,
    updateRoles: fileType.payload.fileInfo.updateRoles,
  };

  try {
    const fileTypes = axios.put(url, data, { headers: headers });
    const fileTypeInfo = yield fileTypes;
    yield put(UpdateFileTypeSucceededService(fileTypeInfo));
  } catch (e) {
    yield put(ErrorNotification({ message: `${e.message} - ${url}` }));
  }
}
