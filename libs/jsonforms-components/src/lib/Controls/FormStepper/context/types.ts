import { Categorization, Category } from '@jsonforms/core';
import { StepStatusType } from '../../../common/Constants';

export interface CategoryInternalState {
  isCompleted?: boolean;
  // clean-code-ignore: RULE-19 — declarations only; nothing is emitted at runtime to unit test.
  // "Started": set when the step holds user entered data as well as when it is navigated through,
  // because the task list status has to show progress on a form resumed from saved data. Do not use
  // it to gate validation messages — entering data in one field would then raise errors on every
  // other field of the step. Use isNavigatedAway for that.
  isVisited?: boolean;
  // "The user has been through this step and moved on": set only by navigation (Next, Previous, or
  // back to the application overview), never derived from data. Gates validation messages, so a
  // step the user has not worked through yet stays quiet.
  isNavigatedAway?: boolean;
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
export interface StepConfig {
  id: string;
  label: string;
  scopePaths: string[];
}

export interface StepStatusData {
  status: StepStatusType;
  hasRequiredFields: boolean;
}
export interface StepperContextDataType {
  categories: CategoriesState;
  activeId: number;
  hasNextButton: boolean;
  hasPrevButton: boolean;
  path: string;
  isOnReview: boolean;
  isValid: boolean;
  maxReachedStep: number; // track the max step reached
  targetScope?: string;
  validationTrigger?: number;
}

export type CategorizationElement = Category | Categorization;
