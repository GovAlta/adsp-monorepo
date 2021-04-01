import {
  ActionTypes,
  FETCH_FILE_SPACE_SUCCESS,
  FILE_DELETE,
  FILE_DISABLE,
  FILE_ENABLE,
  FILE_SETUP,
  FILE_SET_ACTIVE_TAB,
} from './actions';
import { FILE_INIT, FileService } from './models';

export default function (state = FILE_INIT, action: ActionTypes): FileService {
  switch (action.type) {
    case FILE_ENABLE:
      return {
        ...state,
        status: {
          ...state.status,
          isActive: true,
        },
      };

    case FILE_DISABLE:
      return {
        ...state,
        status: {
          ...state.status,
          isActive: true,
        },
        states: {
          ...state.states,
          activeTab: 'overall-view',
        },
      };

    case FILE_SETUP:
      return {
        ...state,
        requirements: {
          ...state.requirements,
          setup: false,
        },
      };

    case FILE_DELETE:
      return {
        ...state,
        requirements: {
          ...state.requirements,
          setup: true,
        },
        states: {
          ...state.states,
          activeTab: 'overall-view',
        },
      };

    case FILE_SET_ACTIVE_TAB:
      console.log(action.payload);
      return {
        ...state,
        states: {
          ...state.states,
          activeTab: action.payload.activeTab,
        },
      };

    case FETCH_FILE_SPACE_SUCCESS:
      return {
        ...state,
        spaces: [action.payload.spaceInfo.data],
      };

    default:
      return state;
  }
}
