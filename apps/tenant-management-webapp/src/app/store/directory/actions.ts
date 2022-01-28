import { Directory } from './models';

export const FETCH_DIRECTORY = 'FETCH_DIRECTORY';
const FETCH_DIRECTORY_SUCCESS = 'FETCH_DIRECTORY_SUCCESS';

export interface FetchDirectoryAction {
  type: typeof FETCH_DIRECTORY;
}

interface FetchDirectorySuccessAction {
  type: typeof FETCH_DIRECTORY_SUCCESS;
  payload: Directory;
}

export type ActionType = FetchDirectoryAction | FetchDirectorySuccessAction;

export const fetchDirectory = (): FetchDirectoryAction => ({
  type: 'FETCH_DIRECTORY',
});

export const fetchDirectorySuccess = (directory: Directory): FetchDirectorySuccessAction => ({
  type: 'FETCH_DIRECTORY_SUCCESS',
  payload: directory,
});
