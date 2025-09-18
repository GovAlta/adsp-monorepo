import { ActionType } from './actions';
import { DIRECTORY_INIT, Directory } from './models';
import {
  FETCH_DIRECTORY_SUCCESS,
  CREATE_ENTRY_SUCCESS,
  UPDATE_ENTRY_SUCCESS,
  DELETE_ENTRY_SUCCESS,
  FETCH_ENTRY_DETAIL_SUCCESS,
  FETCH_RESOURCE_TYPE_SUCCESS,
  UPDATE_RESOURCE_TYPE_SUCCESS,
  DELETE_RESOURCE_TYPE_SUCCESS,
  FETCH_RESOURCE_TYPE_IN_CORE_SUCCESS,
} from './actions';

export default (state = DIRECTORY_INIT, action: ActionType): Directory => {
  switch (action.type) {
    case FETCH_DIRECTORY_SUCCESS: {
      const directories = action.payload;
      directories.forEach((dir) => {
        dir.isCore = dir.namespace.toLowerCase() === 'platform';
        if (dir.service?.indexOf(':') > -1) {
          dir.api = dir.service?.split(':')[1];
          dir.service = dir.service.split(':')[0];
        }
      });
      return { ...state, directory: directories };
    }

    case CREATE_ENTRY_SUCCESS: {
      const directoryList = state.directory;
      directoryList.push(action.payload);
      return { ...state, directory: directoryList };
    }
    case UPDATE_ENTRY_SUCCESS: {
      const directoryUpdateList = state.directory;
      const index = directoryUpdateList.findIndex(
        (x) => x?.service === action.payload?.service && x.api === action.payload.api
      );
      if (index !== -1) {
        directoryUpdateList[index] = action.payload;
      }
      return { ...state, directory: [...directoryUpdateList] };
    }
    case DELETE_ENTRY_SUCCESS: {
      const directoryDelList = state.directory;
      const hasExist = directoryDelList.find(
        (x) => x.service === action.payload.service && x.api === action.payload.api
      );
      if (hasExist) {
        directoryDelList.splice(
          directoryDelList.findIndex((x) => x.service === action.payload.service && x.api === action.payload.api),
          1
        );
      }

      return { ...state, directory: directoryDelList };
    }
    case FETCH_ENTRY_DETAIL_SUCCESS: {
      const directoryUpdateList = state.directory;
      const isExist = directoryUpdateList.find(
        (x) => x.service === action.payload.service && x.api === action.payload.api
      );
      if (isExist) {
        isExist.metadata = action.payload.metadata;
        isExist.loaded = action.payload?.loaded;
      }
      return { ...state, directory: [...directoryUpdateList] };
    }
    case FETCH_RESOURCE_TYPE_IN_CORE_SUCCESS: {
      return { ...state, resourceTypeInCore: action.payload };
    }

    case UPDATE_RESOURCE_TYPE_SUCCESS:
    case FETCH_RESOURCE_TYPE_SUCCESS:
    case DELETE_RESOURCE_TYPE_SUCCESS: {
      return { ...state, resourceType: action.payload };
    }
    default:
      return state;
  }
};
