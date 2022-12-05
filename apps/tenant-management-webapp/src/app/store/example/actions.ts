import { Directory } from './models';

export const FETCH_DIRECTORY = 'tenant/directory-service/directory/fetch';
export const FETCH_DIRECTORY_SUCCESS = 'tenant/directory-service/directory/fetch/success';

// =============
// Actions Types
// =============
export type ActionType = FetchDirectoryAction | FetchDirectorySuccessAction;

export interface FetchDirectoryAction {
  type: typeof FETCH_DIRECTORY;
}

interface FetchDirectorySuccessAction {
  type: typeof FETCH_DIRECTORY_SUCCESS;
  payload: Directory;
}

export const fetchDirectory = (): FetchDirectoryAction => ({
  type: FETCH_DIRECTORY,
});

export const fetchDirectorySuccess = (directory: Directory): FetchDirectorySuccessAction => ({
  type: FETCH_DIRECTORY_SUCCESS,
  payload: directory,
});
