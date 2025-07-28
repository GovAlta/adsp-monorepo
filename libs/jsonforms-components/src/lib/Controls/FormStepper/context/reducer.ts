import { StepperContextDataType } from './types';
import { ErrorObject } from 'ajv';
import { Dispatch } from 'react';
import Ajv from 'ajv';
import { getIncompletePaths, getErrorsInScopes } from './util';

export type JsonFormStepperDispatch = Dispatch<StepperAction>;

export type StepperAction =
  | { type: 'page/next' }
  | { type: 'page/prev' }
  | { type: 'page/to/index'; payload: { id: number } }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { type: 'update/category'; payload: { errors?: ErrorObject[]; id: number; ajv: Ajv; schema: any; data: any } }
  | { type: 'validate/form'; payload: { errors?: ErrorObject[] } }
  | { type: 'toggle/category/review-link'; payload: { id: number } }
  | { type: 'update/uischema'; payload: { state: StepperContextDataType } };

export const stepperReducer = (state: StepperContextDataType, action: StepperAction): StepperContextDataType => {
  const { activeId, categories } = state;
  const lastId = categories[categories.length - 1].id;

  switch (action.type) {
    case 'update/uischema': {
      return { ...action.payload.state };
    }
    case 'page/next': {
      state.activeId += 1;
      if (activeId === lastId) {
        state.isOnReview = true;
        state.hasNextButton = false;
        state.hasPrevButton = false;
      } else {
        state.hasNextButton = true;
        state.hasPrevButton = true;
        state.isOnReview = false;
      }

      state.categories[activeId].isVisited = true;

      return { ...state };
    }
    case 'page/prev': {
      state.categories[activeId].isVisited = true;

      if (activeId > 0) {
        state.activeId -= 1;
        state.hasPrevButton = state.activeId !== 0;
        state.hasNextButton = true;
        state.isOnReview = false;
      }

      return { ...state };
    }

    case 'page/to/index': {
      const { id } = action.payload;
      state.activeId = id;

      if (id === lastId + 1) {
        state.isOnReview = true;
        state.hasNextButton = false;
        state.hasPrevButton = true;
        return { ...state };
      } else {
        if (state.categories[id]) {
          state.categories[id].isVisited = true;
        }
        state.hasNextButton = id <= lastId;
        state.hasPrevButton = id !== 0;
        state.isOnReview = false;
        state.maxReachedStep = Math.max(state.maxReachedStep, activeId);
        return { ...state };
      }
    }
    case 'update/category': {
      const { id, ajv, errors = [], schema, data } = action.payload;
      if (id >= state.categories.length) {
        return { ...state };
      }

      if (schema && typeof schema === 'object') {
        try {
          ajv.validate(schema, data);
        } catch (err) {
          console.warn('AJV validation error:', err);
        }
      }

      const incompletePaths = getIncompletePaths(ajv, schema, data, state.categories[id]?.scopes || []);
      const errorsInCategory = getErrorsInScopes(errors, state.categories[id]?.scopes || []);

      if (state.categories[id]) {
        state.categories[id].isCompleted = incompletePaths?.length === 0;
        state.categories[id].isValid = errorsInCategory.length === 0;
        state.categories[id].isVisited = true;
      }

      return { ...state };
    }
    case 'validate/form': {
      const { errors = [] } = action.payload;
      state.isValid = errors.length === 0;

      return { ...state };
    }

    case 'toggle/category/review-link': {
      const { id } = action.payload;
      state.categories[id].showReviewPageLink = !state.categories[id].showReviewPageLink;
      return { ...state };
    }
    default:
      return state;
  }

  return state;
};
