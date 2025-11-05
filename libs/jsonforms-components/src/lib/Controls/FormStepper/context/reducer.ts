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
      const newActive = activeId + 1;

      const newCategories = categories.map((c, idx) => (idx === activeId ? { ...c, isVisited: true } : c));

      const isOnReview = newActive === lastId + 1;

      return {
        ...state,
        activeId: newActive,
        categories: newCategories,
        isOnReview,
        hasNextButton: !isOnReview,
        hasPrevButton: newActive !== 0,
      };
    }

    case 'page/prev': {
      const newActive = Math.max(0, activeId - 1);

      const newCategories = categories.map((c, idx) => (idx === activeId ? { ...c, isVisited: true } : c));

      return {
        ...state,
        activeId: newActive,
        categories: newCategories,
        isOnReview: false,
        hasNextButton: true,
        hasPrevButton: newActive !== 0,
      };
    }

    case 'page/to/index': {
      const { id } = action.payload;
      const newActive = id;

      const newCategories = categories.map((c, idx) => (idx === id ? { ...c, isVisited: true } : c));

      const isOnReview = newActive === lastId + 1;

      return {
        ...state,
        activeId: newActive,
        categories: newCategories,
        isOnReview,
        hasNextButton: !isOnReview,
        hasPrevButton: newActive !== 0,
        maxReachedStep: Math.max(state.maxReachedStep, activeId),
      };
    }

    case 'update/category': {
      const { id, ajv, errors = [], schema, data } = action.payload;
      if (id >= categories.length) return state;

      try {
        ajv.validate(schema, data);
      } catch (err) {
        console.warn('AJV validation error:', err);
      }

      const incompletePaths = getIncompletePaths(ajv, schema, data, categories[id]?.scopes || []);
      const errorsInCategory = getErrorsInScopes(errors, categories[id]?.scopes || []);

      const newCategories = categories.map((cat, idx) =>
        idx === id
          ? {
              ...cat,
              isCompleted: incompletePaths.length === 0,
              isValid: errorsInCategory.length === 0,
              isVisited: true,
            }
          : cat
      );

      return {
        ...state,
        categories: newCategories,
      };
    }

    case 'validate/form': {
      const { errors = [] } = action.payload;
      return {
        ...state,
        isValid: errors.length === 0,
      };
    }

    case 'toggle/category/review-link': {
      const { id } = action.payload;

      const newCategories = categories.map((cat, idx) =>
        idx === id ? { ...cat, showReviewPageLink: !cat.showReviewPageLink } : cat
      );

      return {
        ...state,
        categories: newCategories,
      };
    }

    default:
      return state;
  }
};
