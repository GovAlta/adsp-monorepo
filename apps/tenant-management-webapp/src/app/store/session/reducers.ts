import { ActionType } from './actions';
import { Session, SESSION_INIT } from './models'

export default function (state: Session = SESSION_INIT, action: ActionType): Session {
  switch(action.type) {
    // TODO: Paul: fetching jwt from keycloak might be a bad idea
    case "session/login/success":
      return {
        ...state,
        ...action.payload
      }

    case "session/logout":
      return SESSION_INIT;

    default:
      return state;
  }
}
