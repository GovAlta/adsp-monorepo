import {
  FormActionTypes,
  FETCH_ALL_TAGS_ACTION,
  FETCH_ALL_TAGS_SUCCESS_ACTION,
  FETCH_ALL_TAGS_FAILED_ACTION,
} from './action';

import { FormResourceTag, FormStateTag } from './model';

export const defaultState: FormStateTag = {
  formResourceTag: {} as FormResourceTag,
};

export default function (state: FormStateTag = defaultState, action: FormActionTypes): FormStateTag {
  switch (action.type) {
    case FETCH_ALL_TAGS_ACTION:
      return {
        ...state,
        formResourceTag: {
          ...state.formResourceTag,
          tagsLoading: true,
          tagsError: null,
        },
      };
    case FETCH_ALL_TAGS_SUCCESS_ACTION:
      return {
        ...state,
        formResourceTag: {
          ...state.formResourceTag,
          tagsLoading: false,
          tags: [...action.payload].sort((a, b) => a.label.localeCompare(b.label)),
        },
      };
    case FETCH_ALL_TAGS_FAILED_ACTION:
      return {
        ...state,
        formResourceTag: {
          ...state.formResourceTag,
          tagsLoading: false,
          tagsError: action.error,
        },
      };

    default:
      return state;
  }
}
