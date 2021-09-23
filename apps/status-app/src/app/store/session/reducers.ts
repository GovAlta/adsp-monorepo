import { ActionTypes } from './actions';
import { SessionInit, Session } from './models';

export const sessionReducer = (state: Session = SessionInit, action: ActionTypes): Session => {
  switch (action.type) {
    case 'session/loading/ready/update':
      return {
        ...state,
        isLoadingReady: action.payload
      };

    case 'session/notifications/add':
      state.notifications.push(action.payload)
      return {
        ...state
      }

    default:
      return state;
  }
}