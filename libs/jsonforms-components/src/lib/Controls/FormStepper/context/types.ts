import { Categorization, Category } from '@jsonforms/core';

export interface CategoryInternalState {
  isCompleted?: boolean;
  isVisited?: boolean;
  isValid?: boolean;
  showReviewPageLink?: boolean;
  id: number;
  uischema?: CategorizationElement;
  isEnabled?: boolean;
  visible?: boolean;
  path?: string;
}

export interface CategoryConfig {
  label: string;
  scopes: string[];
}

export type CategoryState = CategoryInternalState & CategoryConfig;

export type CategoriesState = Array<CategoryState>;

export interface StepperContextDataType {
  categories: CategoriesState;
  activeId: number;
  hasNextButton: boolean;
  hasPrevButton: boolean;
  path: string;
  isOnReview: boolean;
  isValid: boolean;
  maxReachedStep: number; // track the max step reached
  controlPathToFocus?: string;
}

export type CategorizationElement = Category | Categorization;
