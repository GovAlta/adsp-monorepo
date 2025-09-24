import { Service } from './models';

export const FETCH_DIRECTORY = 'directory/FETCH_DIRECTORY_ACTION';
export const FETCH_DIRECTORY_SUCCESS = 'directory/FETCH_DIRECTORY_SUCCESS_ACTION';

export type ActionType =
  | FetchDirectoryAction
  | FetchDirectorySuccessAction;

export interface FetchDirectoryAction {
  type: typeof FETCH_DIRECTORY;
}

interface FetchDirectorySuccessAction {
  type: typeof FETCH_DIRECTORY_SUCCESS;
  payload: Service[];
}

export const fetchDirectory = (): FetchDirectoryAction => ({
  type: FETCH_DIRECTORY,
});

export const fetchDirectorySuccess = (directory: Service[]): FetchDirectorySuccessAction => ({
  type: FETCH_DIRECTORY_SUCCESS,
  payload: directory,
});

