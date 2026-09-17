import { StepperContextDataType } from './types';
import { ErrorObject } from 'ajv';
import { Dispatch } from 'react';
import Ajv from 'ajv';
import { getStepStatus } from './util';
import { StepStatus } from '../../../common/Constants';
import { JsonSchema } from '@jsonforms/core';
import { isSameCategory, isSameStepperState } from './stateEquality';

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
      // isNavigatedAway is tracked here and never recomputed, so the merge is the only thing
      // carrying it across a recompute. Seeding it from the recomputed state instead would let
      // data presence mark a step navigated, which is the whole thing it exists to avoid.
      const mergedCategories = newState.categories.map((newCategory) => {
        const previousCategory = categories.find((c) => c.id === newCategory.id);
        const merged = {
          ...newCategory,
          isVisited: previousCategory?.isVisited || newCategory.isVisited,
          isNavigatedAway: previousCategory?.isNavigatedAway === true,
        };

        return previousCategory && isSameCategory(previousCategory, merged) ? previousCategory : merged;
      });

      const nextState = {
        ...newState,
        categories: mergedCategories,
        maxReachedStep: Math.max(state.maxReachedStep, newState.maxReachedStep ?? 0),
        validationTrigger: state.validationTrigger,
      };

      // This runs on every data change. Returning the previous state when the recompute produced an
      // equivalent one lets useReducer bail out, which keeps a keystroke from re-rendering every
      // control on the page through the stepper context.
      return isSameStepperState(state, nextState) ? state : nextState;
    }

    case 'page/next': {
      const newActive = activeId + 1;

      const newCategories = categories.map((c, idx) =>
        idx === activeId ? { ...c, isVisited: true, isNavigatedAway: true } : c,
      );

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

      const newCategories = categories.map((c, idx) =>
        idx === activeId ? { ...c, isVisited: true, isNavigatedAway: true } : c,
      );

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
        maxReachedStep: Math.max(state.maxReachedStep, activeId, newActive),
        targetScope,
        validationTrigger: (state.validationTrigger || 0) + 1,
      };
    }

    case 'update/category': {
      const { id, ajv, schema, data, errors } = action.payload;

      let validationErrors = errors;
      if (!validationErrors) {
        ajv.validate(schema, data);
        validationErrors = ajv.errors ?? undefined;
      }

      const newCategories = state.categories.map((cat) => {
        // ✅ compare against cat.id, not the index
        if (cat.id !== id) {
          return cat;
        }
        const filteredErrors = validationErrors && validationErrors.filter((error) => error?.data != null);
        const visited = true;
        const { status } = getStepStatus({
          scopes: cat.scopes,
          data,
          errors: filteredErrors ?? [],
          schema,
          visited,
        });

        const isCompleted = status === StepStatus.COMPLETED;
        if (cat.status === status && cat.isCompleted === isCompleted && cat.isValid === isCompleted) {
          return cat;
        }

        return {
          ...cat,
          isCompleted,
          isValid: isCompleted,
          status: status,
        };
      });

      // This fires on entering a page and on every keystroke, and the verdict usually doesn't move.
      // Handing back the same state lets useReducer bail out, which is the difference between one
      // render pass per navigation and two.
      const isUnchanged = newCategories.every((cat, idx) => cat === state.categories[idx]);
      return isUnchanged ? state : { ...state, categories: newCategories };
    }
    case 'set/visited': {
      const { id } = action.payload;

      // Navigating back to a page that is already marked contributes nothing, and returning new
      // state anyway re-renders every control on the page for it.
      const target = state.categories.find((cat) => cat.id === id);
      if (target?.isVisited === true && target?.isNavigatedAway === true) {
        return state;
      }

      const newCategories = state.categories.map((cat) =>
        cat.id === id
          ? {
              ...cat,
              isVisited: true,
              isNavigatedAway: true,
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
      const isValid = errors.length === 0;

      // JsonForms hands back a new errors array on every keystroke even when the errors are
      // identical, so this action fires constantly. Only produce new state when the verdict moved.
      return state.isValid === isValid ? state : { ...state, isValid };
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
