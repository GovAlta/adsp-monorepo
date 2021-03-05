import { FileService } from './models';

export const FETCH_FILE_SPACE = 'tenant/file-service/space/fetch';
export const FETCH_FILE_SPACE_SUCCESS = 'tenant/file-service/space/fetch/successed';
export const FILE_DELETE = 'tenant/file-service/delete';
export const FILE_DISABLE = 'tenant/file-service/activation/';
export const FILE_ENABLE = 'tenant/file-service/activation/activate';
export const FILE_SET_ACTIVE_TAB = 'tenant/file-service/states/tabs/active';
export const FILE_SETUP = 'tenant/file-service/setup'; // The FILE_SETUP is only for testing

// =============
// Actions Types
// =============

export type ActionTypes =
  | DisableFileAction
  | EnableFileAction
  | DeleteFileAction
  | SetActiveTabAction
  | FetchFileSpaceAction
  | FetchFileSpaceSuccessAction
  | SetupFileAction;

interface FetchFileSpaceAction {
  type: typeof FETCH_FILE_SPACE;
}
interface FetchFileSpaceSuccessAction {
  type: typeof FETCH_FILE_SPACE_SUCCESS;
  payload: {
    spaceInfo: { data: string };
  };
}

interface DeleteFileAction {
  type: typeof FILE_DELETE;
  payload: {
    fileService: FileService;
  };
}

interface DisableFileAction {
  type: typeof FILE_DISABLE;
  payload: {
    fileService: FileService;
  };
}

interface EnableFileAction {
  type: typeof FILE_ENABLE;
}

interface SetActiveTabAction {
  type: typeof FILE_SET_ACTIVE_TAB;
  payload: {
    activeTab: string;
  };
}

interface SetupFileAction {
  type: typeof FILE_SETUP;
}

// ==============
// Action Methods
// ==============

export const DisableFileService = (fileService: FileService): DisableFileAction => ({
  type: FILE_DISABLE,
  payload: {
    fileService,
  },
});

export const EnableFileService = (): EnableFileAction => ({
  type: FILE_ENABLE,
});

export const DeleteFileService = (fileService: FileService): DeleteFileAction => ({
  type: FILE_DELETE,
  payload: {
    fileService,
  },
});

export const SetActiveTab = (activeTab: string): SetActiveTabAction => ({
  type: FILE_SET_ACTIVE_TAB,
  payload: {
    activeTab,
  },
});

export const FetchFileSpace = (): FetchFileSpaceAction => ({
  type: FETCH_FILE_SPACE,
});

export const FetchFileSpaceSuccess = (spaceInfo: { data: string }): FetchFileSpaceSuccessAction => ({
  type: FETCH_FILE_SPACE_SUCCESS,
  payload: {
    spaceInfo, // FIXME: this type def (-^) needs to be fixed
  },
});

export const SetupFileService = (): SetupFileAction => ({
  type: FILE_SETUP,
});
