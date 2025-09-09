import { Service, ResourceType } from './models';

export const FETCH_DIRECTORY = 'directory/FETCH_DIRECTORY_ACTION';
export const FETCH_DIRECTORY_SUCCESS = 'directory/FETCH_DIRECTORY_SUCCESS_ACTION';

export const CREATE_ENTRY = 'directory/CREATE_ENTRY_ACTION';
export const CREATE_ENTRY_SUCCESS = 'directory/CREATE_ENTRY_SUCCESS_ACTION';

export const UPDATE_ENTRY = 'directory/UPDATE_ENTRY_ACTION';
export const UPDATE_ENTRY_SUCCESS = 'directory/UPDATE_ENTRY_SUCCESS_ACTION';

export const DELETE_ENTRY = 'directory/DELETE_ENTRY_ACTION';
export const DELETE_ENTRY_SUCCESS = 'directory/DELETE_ENTRY_SUCCESS_ACTION';

export const FETCH_ENTRY_DETAIL = 'directory/FETCH_ENTRY_DETAIL_ACTION';
export const FETCH_ENTRY_DETAIL_SUCCESS = 'directory/FETCH_ENTRY_DETAIL_SUCCESS_ACTION';
export const FETCH_ENTRY_DETAIL_BY_URNS = 'directory/FETCH_ENTRY_DETAIL_BY_URNS_ACTION';

export const FETCH_RESOURCE_TYPE = 'directory/FETCH_RESOURCE_TYPE_ACTION';
export const FETCH_RESOURCE_TYPE_SUCCESS = 'directory/FETCH_RESOURCE_TYPE_SUCCESS_ACTION';
export const FETCH_RESOURCE_TYPE_IN_CORE_SUCCESS = 'directory/FETCH_RESOURCE_TYPE_IN_CORE_SUCCESS_ACTION';

export const UPDATE_RESOURCE_TYPE = 'directory/UPDATE_RESOURCE_TYPE_ACTION';
export const UPDATE_RESOURCE_TYPE_SUCCESS = 'directory/UPDATE_RESOURCE_TYPE_SUCCESS_ACTION';

export const DELETE_RESOURCE_TYPE = 'directory/DELETE_RESOURCE_TYPE_ACTION';
export const DELETE_RESOURCE_TYPE_SUCCESS = 'directory/DELETE_RESOURCE_TYPE_SUCCESS_ACTION';

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
  | DeleteEntrySuccessAction
  | FetchResourceTypeAction
  | FetchResourceTypeSuccessAction
  | FetchResourceTypeInCoreSuccessAction
  | UpdateResourceTypeAction
  | UpdateResourceTypeSuccessAction
  | DeleteResourceTypeAction
  | DeleteResourceTypeSuccessAction;

export interface FetchDirectoryAction {
  type: typeof FETCH_DIRECTORY;
}

interface FetchDirectorySuccessAction {
  type: typeof FETCH_DIRECTORY_SUCCESS;
  payload: Service[];
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

export interface FetchResourceTypeAction {
  type: typeof FETCH_RESOURCE_TYPE;
  next: string;
}
export interface FetchResourceTypeSuccessAction {
  type: typeof FETCH_RESOURCE_TYPE_SUCCESS;
  payload: Record<string, ResourceType[]>;
}

export interface FetchResourceTypeInCoreSuccessAction {
  type: typeof FETCH_RESOURCE_TYPE_IN_CORE_SUCCESS;
  payload: Record<string, ResourceType[]>;
}

export interface UpdateResourceTypeAction {
  type: typeof UPDATE_RESOURCE_TYPE;
  resourceType: ResourceType[];
  urn?: string;
}
export interface UpdateResourceTypeSuccessAction {
  type: typeof UPDATE_RESOURCE_TYPE_SUCCESS;
  payload: Record<string, ResourceType[]>;
}
export interface FetchEntryDetailByURNsAction {
  type: typeof FETCH_ENTRY_DETAIL_BY_URNS;
  payload: string[];
}
export interface DeleteResourceTypeAction {
  type: typeof DELETE_RESOURCE_TYPE;
  urn?: string;
}
export interface DeleteResourceTypeSuccessAction {
  type: typeof DELETE_RESOURCE_TYPE_SUCCESS;
  payload: Record<string, ResourceType[]>;
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

export const fetchDirectorySuccess = (directory: Service[]): FetchDirectorySuccessAction => ({
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

export const fetchResourceTypeAction = (next?: string): FetchResourceTypeAction => ({
  type: FETCH_RESOURCE_TYPE,
  next,
});

export const fetchResourceTypeSuccessAction = (
  payload: Record<string, ResourceType[]>
): FetchResourceTypeSuccessAction => ({
  type: FETCH_RESOURCE_TYPE_SUCCESS,
  payload,
});

export const fetchResourceTypeInCoreSuccessAction = (
  payload: Record<string, ResourceType[]>
): FetchResourceTypeInCoreSuccessAction => ({
  type: FETCH_RESOURCE_TYPE_IN_CORE_SUCCESS,
  payload,
});

export const updateResourceTypeAction = (resourceType: ResourceType[], urn?: string): UpdateResourceTypeAction => ({
  type: UPDATE_RESOURCE_TYPE,
  resourceType,
  urn,
});

export const updateResourceTypeSuccessAction = (
  payload: Record<string, ResourceType[]>
): UpdateResourceTypeSuccessAction => ({
  type: UPDATE_RESOURCE_TYPE_SUCCESS,
  payload,
});

export const deleteResourceTypeAction = (urn?: string): DeleteResourceTypeAction => ({
  type: DELETE_RESOURCE_TYPE,
  urn,
});

export const deleteResourceTypeSuccessAction = (
  payload: Record<string, ResourceType[]>
): DeleteResourceTypeSuccessAction => ({
  type: DELETE_RESOURCE_TYPE_SUCCESS,
  payload,
});
