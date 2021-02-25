import * as TYPES from './types';

export const DISABLE_FILE = (fileService) => ({
  type: TYPES.FILE_DISABLE,
  payload: {
    fileService,
  },
});

export const ENABLE_FILE = (fileService) => ({
  type: TYPES.FILE_ENABLE,
  payload: {
    fileService,
  },
});

export const FILE_DELETE = (fileService) => ({
  type: TYPES.FILE_DELETE,
  payload: {
    fileService,
  },
});

export const SET_ACTIVE_TAB = (activeTab) => ({
  type: TYPES.FILE_SETUP,
  payload: {
    activeTab,
  },
});

export const FETCH_FILE_SPACE = (config) => ({
  type: TYPES.FETCH_FILE_SPACE,
  payload: {
    config,
  },
});

export const FETCH_FILE_SPACE_SUCCEEDED = (spaceInfo) => ({
  type: TYPES.FETCH_FILE_SPACE_SUCCEEDED,
  payload: {
    spaceInfo,
  },
});
