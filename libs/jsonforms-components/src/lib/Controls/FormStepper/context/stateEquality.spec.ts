import { StepStatus } from '../../../common/Constants';
import { areSameCategories, isSameCategory, isSameStepperState } from './stateEquality';
import { CategoryState, StepperContextDataType } from './types';

const buildCategory = (overrides: Partial<CategoryState> = {}): CategoryState =>
  ({
    id: 0,
    label: 'Step 1',
    scopes: ['#/properties/field0'],
    isCompleted: false,
    isValid: false,
    isVisited: false,
    isNavigatedAway: false,
    status: StepStatus.NOT_STARTED,
    isEnabled: true,
    visible: true,
    ...overrides,
  }) as unknown as CategoryState;

const buildState = (overrides: Partial<StepperContextDataType> = {}): StepperContextDataType => ({
  categories: [buildCategory(), buildCategory({ id: 1, label: 'Step 2' })],
  activeId: 0,
  hasNextButton: true,
  hasPrevButton: false,
  path: '',
  isOnReview: false,
  isValid: false,
  maxReachedStep: 0,
  validationTrigger: 0,
  ...overrides,
});

describe('stateEquality', () => {
  describe('isSameCategory', () => {
    it('treats a rebuilt but identical category as unchanged', () => {
      expect(isSameCategory(buildCategory(), buildCategory())).toBe(true);
    });

    it('compares scopes by value rather than by array identity', () => {
      const previous = buildCategory({ scopes: ['#/properties/a', '#/properties/b'] });
      const next = buildCategory({ scopes: ['#/properties/a', '#/properties/b'] });

      expect(isSameCategory(previous, next)).toBe(true);
    });

    it('detects a changed scope', () => {
      const previous = buildCategory({ scopes: ['#/properties/a'] });
      const next = buildCategory({ scopes: ['#/properties/b'] });

      expect(isSameCategory(previous, next)).toBe(false);
    });

    it('detects a changed status', () => {
      const next = buildCategory({ status: StepStatus.COMPLETED } as Partial<CategoryState>);

      expect(isSameCategory(buildCategory(), next)).toBe(false);
    });

    it('detects a field that is only present on one side', () => {
      const next = buildCategory({ showReviewPageLink: true });

      expect(isSameCategory(buildCategory(), next)).toBe(false);
    });
  });

  describe('areSameCategories', () => {
    it('detects a different number of categories', () => {
      expect(areSameCategories([buildCategory()], [buildCategory(), buildCategory({ id: 1 })])).toBe(false);
    });
  });

  describe('isSameStepperState', () => {
    it('treats a rebuilt but identical state as unchanged', () => {
      expect(isSameStepperState(buildState(), buildState())).toBe(true);
    });

    it('detects navigation to another page', () => {
      expect(isSameStepperState(buildState(), buildState({ activeId: 1 }))).toBe(false);
    });

    it('detects a validity change', () => {
      expect(isSameStepperState(buildState(), buildState({ isValid: true }))).toBe(false);
    });

    it('detects a validation trigger change so a repeat navigation still revalidates', () => {
      expect(isSameStepperState(buildState(), buildState({ validationTrigger: 1 }))).toBe(false);
    });

    it('detects a category change', () => {
      const next = buildState({ categories: [buildCategory({ isVisited: true }), buildCategory({ id: 1 })] });

      expect(isSameStepperState(buildState(), next)).toBe(false);
    });
  });
});
