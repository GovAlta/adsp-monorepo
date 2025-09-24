import { Tag } from './model';


export const FETCH_ALL_TAGS_ACTION = 'form/resource/fetch-all-tags';
export const FETCH_ALL_TAGS_SUCCESS_ACTION = 'form/resource/fetch-all-tags/success';
export const FETCH_ALL_TAGS_FAILED_ACTION = 'form/resource/fetch-all-tags/failed';

export type FormActionTypes =
  | FetchAllTagsAction
  | FetchAllTagsSuccessAction
  | FetchAllTagsFailedAction


export interface FetchAllTagsAction {
  type: typeof FETCH_ALL_TAGS_ACTION;
}

export interface FetchAllTagsSuccessAction {
  type: typeof FETCH_ALL_TAGS_SUCCESS_ACTION;
  payload: Tag[];
}

export interface FetchAllTagsFailedAction {
  type: typeof FETCH_ALL_TAGS_FAILED_ACTION;
  error: string;
}

export const fetchAllTags = (): FetchAllTagsAction => ({
  type: FETCH_ALL_TAGS_ACTION,
});

export const fetchAllTagsSuccess = (tags: Tag[]): FetchAllTagsSuccessAction => ({
  type: FETCH_ALL_TAGS_SUCCESS_ACTION,
  payload: tags,
});

export const fetchAllTagsFailed = (error: string): FetchAllTagsFailedAction => ({
  type: FETCH_ALL_TAGS_FAILED_ACTION,
  error,
});
