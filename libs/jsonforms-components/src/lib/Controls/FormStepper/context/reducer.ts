import { StepperContextDataType } from './types';
import { ErrorObject } from 'ajv';
import { Dispatch } from 'react';
import Ajv from 'ajv';
import { getStepStatus } from './util';
import { StepStatus } from '../../../common/Constants';
import { JsonSchema } from '@jsonforms/core';

export type JsonFormStepperDispatch = Dispatch<StepperAction>;

export type StepperAction =
  | { type: 'page/next' }
  | { type: 'page/prev' }
  | { type: 'page/to/index'; payload: { id: number; targetScope?: string } }
  | { type: 'set/visited'; payload: { id: number } }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | {
      type: 'update/category';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload: { errors?: ErrorObject[]; id: number; ajv: Ajv; schema: JsonSchema; data: any };
    }
  | { type: 'validate/form'; payload: { errors?: ErrorObject[] } }
  | { type: 'toggle/category/review-link'; payload: { id: number } }
  | { type: 'update/uischema'; payload: { state: StepperContextDataType } };

export const stepperReducer = (state: StepperContextDataType, action: StepperAction): StepperContextDataType => {
  const { activeId, categories } = state;
  const lastId = categories[categories.length - 1].id;

  switch (action.type) {
    case 'update/uischema': {
      const newState = action.payload.state;

      // createStepperContextInitData recomputes categories purely from the
      // current data/schema snapshot, so a category with no data in its scopes
      // is reported as not visited even if the user already navigated through it
      // (page/next, page/prev, or setVisited previously marked it visited).
      // Preserve any previously-tracked isVisited=true so navigation history
      // isn't lost whenever unrelated form data changes trigger this recompute.
      const mergedCategories = newState.categories.map((newCategory) => {
        const previousCategory = categories.find((c) => c.id === newCategory.id);
        return {
          ...newCategory,
          isVisited: previousCategory?.isVisited || newCategory.isVisited,
        };
      });

      return { ...newState, categories: mergedCategories };
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
        targetScope: undefined,
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
        targetScope: undefined,
      };
    }

    case 'page/to/index': {
      const { id, targetScope } = action.payload;
      const newActive = id;
      const isOnReview = newActive === lastId + 1;

      return {
        ...state,
        activeId: newActive,
        categories: categories,
        isOnReview,
        hasNextButton: !isOnReview,
        hasPrevButton: newActive !== 0,
        maxReachedStep: Math.max(state.maxReachedStep, activeId),
        targetScope,
        validationTrigger: (state.validationTrigger || 0) + 1,
      };
    }

    case 'update/category': {
      const { id, ajv, schema, data } = action.payload;

      ajv.validate(schema, data);

      const newCategories = state.categories.map((cat) => {
        // ✅ compare against cat.id, not the index
        if (cat.id !== id) {
          return cat;
        }
        const filteredErrors = ajv.errors && ajv.errors.filter((error) => error?.data != null);
        const visited = true;
        const statusData = getStepStatus({
          scopes: cat.scopes,
          data,
          errors: filteredErrors ?? [],
          schema,
          visited,
        });

        return {
          ...cat,
          isCompleted: statusData.status === StepStatus.COMPLETED,
          isValid: statusData.status === StepStatus.COMPLETED,
          status: statusData.status,
        };
      });

      return { ...state, categories: newCategories };
    }
    case 'set/visited': {
      const { id } = action.payload;

      const newCategories = state.categories.map((cat) =>
        cat.id === id
          ? {
              ...cat,
              isVisited: true,
            }
          : cat,
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
        idx === id ? { ...cat, showReviewPageLink: !cat.showReviewPageLink } : cat,
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
