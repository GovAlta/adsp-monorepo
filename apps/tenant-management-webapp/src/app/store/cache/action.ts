import { CacheTarget } from './model';

export const FETCH_CACHE_DEFINITIONS_ACTION = 'cache/FETCH_CACHE_DEFINITIONS_ACTION';
export const FETCH_CACHE_DEFINITIONS_SUCCESS_ACTION = 'cache/FETCH_CACHE_DEFINITIONS_SUCCESS_ACTION';
export const UPDATE_CACHE_TARGETS_ACTION = 'cache/UPDATE_CACHE_TARGETS_ACTION';
export const UPDATE_CACHE_TARGETS_SUCCESS_ACTION = 'cache/UPDATE_CACHE_TARGETS_SUCCESS_ACTION';

export type CacheActionTypes =
  | FetchCacheTargetsAction
  | FetchCacheTargetsSuccessAction
  | UpdateCacheTargetAction
  | UpdateCacheTargetSuccessAction;

export interface FetchCacheTargetsAction {
  type: typeof FETCH_CACHE_DEFINITIONS_ACTION;
  next?: string;
}

export interface FetchCacheTargetsSuccessAction {
  type: typeof FETCH_CACHE_DEFINITIONS_SUCCESS_ACTION;
  payload: Record<string, CacheTarget>;
}

export interface UpdateCacheTargetAction {
  type: typeof UPDATE_CACHE_TARGETS_ACTION;
  definition: CacheTarget;
  options?: string;
}

export interface UpdateCacheTargetSuccessAction {
  type: typeof UPDATE_CACHE_TARGETS_SUCCESS_ACTION;
  payload: CacheTarget;
}

export const getCacheTargets = (next?: string): FetchCacheTargetsAction => ({
  type: FETCH_CACHE_DEFINITIONS_ACTION,
  next,
});

export const getCacheTargetsSuccess = (results: Record<string, CacheTarget>): FetchCacheTargetsSuccessAction => ({
  type: FETCH_CACHE_DEFINITIONS_SUCCESS_ACTION,
  payload: results,
});

export const updateCacheTarget = (definition: CacheTarget, options?: string): UpdateCacheTargetAction => ({
  type: UPDATE_CACHE_TARGETS_ACTION,
  definition,
  options,
});

export const updateCacheTargetSuccess = (definition: CacheTarget): UpdateCacheTargetSuccessAction => ({
  type: UPDATE_CACHE_TARGETS_SUCCESS_ACTION,
  payload: definition,
});
