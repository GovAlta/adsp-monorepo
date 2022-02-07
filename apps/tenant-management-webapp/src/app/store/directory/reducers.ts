import { ActionType } from './actions';
import { DIRECTORY_INIT, Directory } from './models';

export default (state = DIRECTORY_INIT, action: ActionType): Directory => {
  switch (action.type) {
    case 'FETCH_DIRECTORY_SUCCESS':
      return { ...state, directory: action.payload.directory };

    default:
      return state;
  }
};
