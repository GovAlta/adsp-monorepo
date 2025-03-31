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
  payload: { tenant: Record<string, CacheTarget>; core: Record<string, CacheTarget> };
}

export interface UpdateCacheTargetAction {
  type: typeof UPDATE_CACHE_TARGETS_ACTION;
  definition: Record<string, CacheTarget>;
  options?: string;
}

export interface UpdateCacheTargetSuccessAction {
  type: typeof UPDATE_CACHE_TARGETS_SUCCESS_ACTION;
  payload: Record<string, CacheTarget>;
}

export const getCacheTargets = (next?: string): FetchCacheTargetsAction => ({
  type: FETCH_CACHE_DEFINITIONS_ACTION,
  next,
});

export const getCacheTargetsSuccess = (results: {
  tenant: Record<string, CacheTarget>;
  core: Record<string, CacheTarget>;
}): FetchCacheTargetsSuccessAction => ({
  type: FETCH_CACHE_DEFINITIONS_SUCCESS_ACTION,
  payload: results,
});

export const updateCacheTarget = (
  definition: Record<string, CacheTarget>,
  options?: string
): UpdateCacheTargetAction => ({
  type: UPDATE_CACHE_TARGETS_ACTION,
  definition,
  options,
});

export const updateCacheTargetSuccess = (definition: Record<string, CacheTarget>): UpdateCacheTargetSuccessAction => ({
  type: UPDATE_CACHE_TARGETS_SUCCESS_ACTION,
  payload: definition,
});
