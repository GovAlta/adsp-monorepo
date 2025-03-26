import {
  FETCH_CACHE_DEFINITIONS_SUCCESS_ACTION,
  CacheActionTypes,
  UPDATE_CACHE_TARGETS_SUCCESS_ACTION,
} from './action';

import { CacheState } from './model';

export const defaultState: CacheState = {
  targets: {},
  nextEntries: null,
};

export default function (state: CacheState = defaultState, action: CacheActionTypes): CacheState {
  switch (action.type) {
    case FETCH_CACHE_DEFINITIONS_SUCCESS_ACTION:
      return {
        ...state,
        targets: { ...state.targets, ...action.payload },
      };
    case UPDATE_CACHE_TARGETS_SUCCESS_ACTION:
      return {
        ...state,
        targets: { ...state.targets, ...action.payload },
      };
    default:
      return state;
  }
}
