import { CacheTarget } from './model';

export const FETCH_CACHE_DEFINITIONS_ACTION = 'cache/FETCH_CACHE_DEFINITIONS_ACTION';
export const FETCH_CACHE_DEFINITIONS_SUCCESS_ACTION = 'cache/FETCH_CACHE_DEFINITIONS_SUCCESS_ACTION';

export type CacheActionTypes = FetchCacheTargetsAction | FetchCacheTargetsSuccessAction;

export interface FetchCacheTargetsAction {
  type: typeof FETCH_CACHE_DEFINITIONS_ACTION;
  next?: string;
}

export interface FetchCacheTargetsSuccessAction {
  type: typeof FETCH_CACHE_DEFINITIONS_SUCCESS_ACTION;
  payload: Record<string, CacheTarget>;
}

export const getCacheTargets = (next?: string): FetchCacheTargetsAction => ({
  type: FETCH_CACHE_DEFINITIONS_ACTION,
  next,
});

export const getCacheTargetsSuccess = (results: Record<string, CacheTarget>): FetchCacheTargetsSuccessAction => ({
  type: FETCH_CACHE_DEFINITIONS_SUCCESS_ACTION,
  payload: results,
});
