import { ActionType } from './actions';
import { DIRECTORY_INIT, Directory } from './models';
import { FETCH_DIRECTORY_SUCCESS, CREATE_ENTRY_SUCCESS, UPDATE_ENTRY_SUCCESS, DELETE_ENTRY_SUCCESS } from './actions';

export default (state = DIRECTORY_INIT, action: ActionType): Directory => {
  switch (action.type) {
    case FETCH_DIRECTORY_SUCCESS:
      return { ...state, directory: action.payload.directory };

    case CREATE_ENTRY_SUCCESS: {
      const directoryList = state.directory;
      directoryList.push(action.payload);
      return { ...state, directory: directoryList };
    }
    case UPDATE_ENTRY_SUCCESS: {
      const directoryUpdateList = state.directory;
      const isExist = directoryUpdateList.find((x) => x.namespace === action.payload.namespace);
      if (isExist) {
        if (action.payload.api) {
          isExist.api = action.payload.api;
        }
        isExist.url = action.payload.url;
      }

      return { ...state, directory: directoryUpdateList };
    }
    case DELETE_ENTRY_SUCCESS: {
      const directoryDelList = state.directory;
      const hasExist = directoryDelList.find((x) => x.namespace === action.payload.namespace);
      if (hasExist) {
        directoryDelList.splice(
          directoryDelList.findIndex((item) => item.namespace === action.payload.namespace),
          1
        );
      }

      return { ...state, directory: directoryDelList };
    }
    default:
      return state;
  }
};
