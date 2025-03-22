import { FETCH_CACHE_DEFINITIONS_SUCCESS_ACTION, CacheActionTypes } from './action';

import { CacheState } from './model';

export const defaultState: CacheState = {
  targets: {},
  nextEntries: null,
};

export default function (state: CacheState = defaultState, action: CacheActionTypes): CacheState {
  switch (action.type) {
    case FETCH_CACHE_DEFINITIONS_SUCCESS_ACTION:
      console.log(JSON.stringify(action) + '<action');
      return {
        ...state,
        targets: action.after
          ? { ...state.targets, ...action.payload }
          : action.payload
          ? action.payload
          : state.targets,
        nextEntries: action.next,
      };

    default:
      return state;
  }
}
