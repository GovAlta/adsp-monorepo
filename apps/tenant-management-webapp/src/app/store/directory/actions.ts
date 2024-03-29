import { Directory, Service } from './models';

export const FETCH_DIRECTORY = 'tenant/directory-service/directory/fetch';
export const FETCH_DIRECTORY_SUCCESS = 'tenant/directory-service/directory/fetch/success';

export const CREATE_ENTRY = 'tenant/directory-service/entry/create';
export const CREATE_ENTRY_SUCCESS = 'tenant/directory-service/entry/create/success';

export const UPDATE_ENTRY = 'tenant/directory-service/entry/update';
export const UPDATE_ENTRY_SUCCESS = 'tenant/directory-service/entry/update/success';

export const DELETE_ENTRY = 'tenant/directory-service/entry/delete';
export const DELETE_ENTRY_SUCCESS = 'tenant/directory-service/entry/delete/success';

export const FETCH_ENTRY_DETAIL = 'tenant/directory-service/entry/detail';
export const FETCH_ENTRY_DETAIL_SUCCESS = 'tenant/directory-service/entry/detail/success';
export const FETCH_ENTRY_DETAIL_BY_URNS = 'tenant/directory-service/urn/detail/';

// =============
// Actions Types
// =============
export type ActionType =
  | FetchDirectoryAction
  | FetchDirectorySuccessAction
  | FetchEntryDetailAction
  | FetchEntryDetailSuccessAction
  | CreateEntryAction
  | CreateEntrySuccessAction
  | UpdateEntryAction
  | UpdateEntrySuccessAction
  | DeleteEntryAction
  | FetchEntryDetailByURNsAction
  | DeleteEntrySuccessAction;

export interface FetchDirectoryAction {
  type: typeof FETCH_DIRECTORY;
}

interface FetchDirectorySuccessAction {
  type: typeof FETCH_DIRECTORY_SUCCESS;
  payload: Directory;
}

export interface CreateEntryAction {
  type: typeof CREATE_ENTRY;
  data: Service;
}

interface CreateEntrySuccessAction {
  type: typeof CREATE_ENTRY_SUCCESS;
  payload: Service;
}
export interface UpdateEntryAction {
  type: typeof UPDATE_ENTRY;
  data: Service;
}

interface UpdateEntrySuccessAction {
  type: typeof UPDATE_ENTRY_SUCCESS;
  payload: Service;
}

export interface DeleteEntryAction {
  type: typeof DELETE_ENTRY;
  data: Service;
}

export interface FetchEntryDetailByURNsAction {
  type: typeof FETCH_ENTRY_DETAIL_BY_URNS;
  payload: string[];
}

interface DeleteEntrySuccessAction {
  type: typeof DELETE_ENTRY_SUCCESS;
  payload: Service;
}
export interface FetchEntryDetailAction {
  type: typeof FETCH_ENTRY_DETAIL;
  data: Service;
}

interface FetchEntryDetailSuccessAction {
  type: typeof FETCH_ENTRY_DETAIL_SUCCESS;
  payload: Service;
}

export const fetchDirectory = (): FetchDirectoryAction => ({
  type: FETCH_DIRECTORY,
});

export const fetchDirectorySuccess = (directory: Directory): FetchDirectorySuccessAction => ({
  type: FETCH_DIRECTORY_SUCCESS,
  payload: directory,
});

export const createEntry = (data: Service): CreateEntryAction => ({
  type: CREATE_ENTRY,
  data,
});

export const createEntrySuccess = (data: Service): CreateEntrySuccessAction => ({
  type: CREATE_ENTRY_SUCCESS,
  payload: data,
});

export const updateEntry = (data: Service): UpdateEntryAction => ({
  type: UPDATE_ENTRY,
  data,
});

export const updateEntrySuccess = (data: Service): UpdateEntrySuccessAction => ({
  type: UPDATE_ENTRY_SUCCESS,
  payload: data,
});

export const deleteEntry = (data: Service): DeleteEntryAction => ({
  type: DELETE_ENTRY,
  data,
});

export const deleteEntrySuccess = (data: Service): DeleteEntrySuccessAction => ({
  type: DELETE_ENTRY_SUCCESS,
  payload: data,
});

export const fetchEntryDetail = (data: Service): FetchEntryDetailAction => ({
  type: FETCH_ENTRY_DETAIL,
  data,
});

export const fetchEntryDetailSuccess = (data: Service): FetchEntryDetailSuccessAction => ({
  type: FETCH_ENTRY_DETAIL_SUCCESS,
  payload: data,
});

export const fetchDirectoryDetailByURNs = (data: string[]): FetchEntryDetailByURNsAction => ({
  type: FETCH_ENTRY_DETAIL_BY_URNS,
  payload: data,
});
