import {
  AuditActionTypes,
  CLEAR_AUDIT_EVENTS_ACTION,
  EXPORT_AUDIT_EVENTS_ACTION,
  EXPORT_AUDIT_EVENTS_DONE_ACTION,
  FETCH_AUDIT_CONFIGURATION_SUCCESS_ACTION,
  FETCH_AUDIT_EVENTS_ACTION,
  FETCH_AUDIT_EVENTS_FAILED_ACTION,
  FETCH_AUDIT_EVENTS_SUCCESS_ACTION,
} from './actions';
import { AuditState, defaultAuditState } from './models';

export default function (state: AuditState = defaultAuditState, action: AuditActionTypes): AuditState {
  switch (action.type) {
    case FETCH_AUDIT_CONFIGURATION_SUCCESS_ACTION:
      return { ...state, catalogs: action.catalogs, retention: action.retention, namespaces: action.namespaces, loaded: true };
    case FETCH_AUDIT_EVENTS_ACTION:
      return { ...state, events: { ...state.events, loading: true } };
    case FETCH_AUDIT_EVENTS_SUCCESS_ACTION:
      return {
        ...state,
        events: {
          results: action.append ? [...state.events.results, ...action.results] : action.results,
          next: action.next,
          loading: false,
        },
      };
    case FETCH_AUDIT_EVENTS_FAILED_ACTION:
      return { ...state, events: { ...state.events, loading: false } };
    case CLEAR_AUDIT_EVENTS_ACTION:
      return { ...state, events: defaultAuditState.events };
    case EXPORT_AUDIT_EVENTS_ACTION:
      return { ...state, exporting: true };
    case EXPORT_AUDIT_EVENTS_DONE_ACTION:
      return { ...state, exporting: false };
    default:
      return state;
  }
}
