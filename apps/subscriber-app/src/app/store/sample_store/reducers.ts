import { ActionTypes } from './actions';

export const sampleReducer = (state: any = {}, action: ActionTypes) => {
  switch (action.type) {
    case 'status/notices/fetch':
      return {};
    default:
      return state;
  }
};
