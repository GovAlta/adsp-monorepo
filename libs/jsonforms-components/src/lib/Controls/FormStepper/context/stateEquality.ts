import { CategoriesState, CategoryState, StepperContextDataType } from './types';

const haveSameScopes = (previous: unknown, next: unknown): boolean => {
  if (previous === next) {
    return true;
  }
  if (!Array.isArray(previous) || !Array.isArray(next) || previous.length !== next.length) {
    return false;
  }
  return previous.every((scope, index) => scope === next[index]);
};

/**
 * Compares two categories by content.
 *
 * Every recompute rebuilds the category objects, so identity alone cannot tell whether anything
 * actually changed. Comparing the fields is what lets an unchanged category keep its previous
 * object, and in turn lets a whole unchanged state be reused.
 */
export const isSameCategory = (previous: CategoryState, next: CategoryState): boolean => {
  if (previous === next) {
    return true;
  }

  const previousFields = previous as unknown as Record<string, unknown>;
  const nextFields = next as unknown as Record<string, unknown>;
  const previousKeys = Object.keys(previousFields);

  if (previousKeys.length !== Object.keys(nextFields).length) {
    return false;
  }

  return previousKeys.every((key) =>
    key === 'scopes' ? haveSameScopes(previousFields[key], nextFields[key]) : previousFields[key] === nextFields[key],
  );
};

export const areSameCategories = (previous: CategoriesState, next: CategoriesState): boolean =>
  previous === next ||
  (previous.length === next.length && previous.every((category, index) => isSameCategory(category, next[index])));

export const isSameStepperState = (previous: StepperContextDataType, next: StepperContextDataType): boolean =>
  previous === next ||
  (previous.activeId === next.activeId &&
    previous.hasNextButton === next.hasNextButton &&
    previous.hasPrevButton === next.hasPrevButton &&
    previous.path === next.path &&
    previous.isOnReview === next.isOnReview &&
    previous.isValid === next.isValid &&
    previous.maxReachedStep === next.maxReachedStep &&
    previous.targetScope === next.targetScope &&
    previous.validationTrigger === next.validationTrigger &&
    areSameCategories(previous.categories, next.categories));
