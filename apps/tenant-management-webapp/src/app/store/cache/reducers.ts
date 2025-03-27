import {
  FETCH_CACHE_DEFINITIONS_SUCCESS_ACTION,
  CacheActionTypes,
  UPDATE_CACHE_TARGETS_SUCCESS_ACTION,
} from './action';
import { merge } from 'lodash';

import { CacheState } from './model';

export const defaultState: CacheState = {
  targets: { core: {}, tenant: {} },
  nextEntries: null,
};

export default function (state: CacheState = defaultState, action: CacheActionTypes): CacheState {
  switch (action.type) {
    case FETCH_CACHE_DEFINITIONS_SUCCESS_ACTION:
      console.log(JSON.stringify(action.payload) + '<-action.payloadaction.payload.targets');
      return {
        ...state,
        targets: { ...state.targets, ...action.payload },
      };
    case UPDATE_CACHE_TARGETS_SUCCESS_ACTION:
      console.log(JSON.stringify(action.payload) + '<action.payload');
      console.log(JSON.stringify(state.targets) + '<-state.targets');
      console.log(
        JSON.stringify(merge({}, state.targets, action.payload)) + '<-merge({}, state.targets, action.payload)'
      );
      return {
        ...state,
        targets: merge({}, state.targets, action.payload), // Deep merge instead of shallow merge
      };
    default:
      return state;
  }
}
