import { TYPES } from '../actions';
import INIT_STATE from './initialState';

export default function (state = INIT_STATE.tenant.file, action) {
  if (action.type === TYPES.FILE_ENABLE) {
    const _status = state.status;
    _status.isActive = true;
    return {
      ...state,
      status: _status,
    };
  }

  if (action.type === TYPES.FILE_DISABLE) {
    const _status = state.status;
    const _states = state.states;
    _states.activeTab = 'overall-view';
    _status.isActive = false;
    return {
      ...state,
      status: _status,
      states: _states,
    };
  }

  if (action.type === TYPES.FILE_SETUP) {
    const _requirements = state.requirements;
    _requirements.setup = false;

    return {
      ...state,
      requirements: _requirements,
    };
  }

  if (action.type === TYPES.FILE_DELETE) {
    const _requirements = state.requirements;
    const _states = state.states;
    _requirements.setup = true;
    _states.activeTab = 'overall-view';

    return {
      ...state,
      requirements: _requirements,
      states: _states,
    };
  }

  if (action.type === TYPES.FILE_SET_ACTIVE_TAB) {
    const _states = state.states;
    _states.activeTab = action.key;
    return {
      ...state,
      states: _states,
    };
  }

  if (action.type === TYPES.FETCH_FILE_SPACE_SUCCEEDED) {
    // action is the spaceInfo
    return {
      ...state,
      spaces: [action.payload.data],
    };
  }

  return state;
}
