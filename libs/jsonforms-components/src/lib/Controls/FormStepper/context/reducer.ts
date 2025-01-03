import { StepperContextDataType } from './types';
import { ErrorObject } from 'ajv';
import { toDataPath } from '@jsonforms/core';
import { Dispatch } from 'react';

export type JsonFormStepperDispatch = Dispatch<StepperAction>;

export type StepperAction =
  | { type: 'page/next' }
  | { type: 'page/prev' }
  | { type: 'page/to/index'; payload: { id: number } }
  | { type: 'update/category'; payload: { errors: ErrorObject[]; id: number } }
  | { type: 'validate/form'; payload: { errors?: ErrorObject[] } }
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

      if (id > lastId) {
        state.isOnReview = true;
        state.hasNextButton = false;
        state.hasPrevButton = false;
        return { ...state };
      } else {
        state.categories[id].isVisited = true;
        state.hasNextButton = id <= lastId;
        state.hasPrevButton = id !== 0;
        state.isOnReview = false;
        return { ...state };
      }
    }
    case 'update/category': {
      const { id, errors } = action.payload as { errors: ErrorObject[]; id: number };
      if (state.isOnReview) {
        return { ...state };
      }
      const errorsInCategory = errors.filter((e) =>
        categories[id].scopes.map((s) => '/' + toDataPath(s)).includes(e.instancePath)
      );
      state.categories[id].isCompleted = errorsInCategory.filter((e) => e.keyword === 'required').length === 0;
      state.categories[id].isValid = errorsInCategory.length === 0;
      return { ...state };
    }
    case 'validate/form': {
      const { errors } = action.payload as { errors: ErrorObject[] };
      state.isValid = errors.length === 0;

      return { ...state };
    }
    default:
      return state;
  }

  return state;
};
