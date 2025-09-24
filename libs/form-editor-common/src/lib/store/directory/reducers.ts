import { ActionType } from './actions';
import { DIRECTORY_INIT, Directory } from './models';
import {
  FETCH_DIRECTORY_SUCCESS,
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
    default:
      return state;
  }
};
