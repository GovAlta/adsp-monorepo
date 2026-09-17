import Ajv from 'ajv';
import { stepperReducer } from './reducer';
import { StepperContextDataType, CategoryState } from './types';
import { StepStatus } from '../../../common/Constants';

const buildCategory = (id: number, scopes: string[] = [`#/properties/field${id}`]): CategoryState => ({
  id,
  label: `Step ${id + 1}`,
  scopes,
  isCompleted: false,
  isValid: false,
  isVisited: false,
  isNavigatedAway: false,
  status: StepStatus.NOT_STARTED,
});

const buildState = (overrides: Partial<StepperContextDataType> = {}): StepperContextDataType => ({
  categories: [buildCategory(0), buildCategory(1)],
  activeId: 0,
  hasNextButton: true,
  hasPrevButton: false,
  path: 'test-path',
  isOnReview: false,
  isValid: true,
  maxReachedStep: 0,
  validationTrigger: 0,
  ...overrides,
});

describe('stepperReducer', () => {
  test('returns the same state for an unknown action type', () => {
    // Arrange
    const state = buildState();

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = stepperReducer(state, { type: 'unknown/action' } as any);

    // Assert
    expect(result).toBe(state);
  });

  describe('page/next', () => {
    test('advances the active page and marks the current category as visited', () => {
      // Arrange
      const state = buildState({ activeId: 0 });

      // Act
      const result = stepperReducer(state, { type: 'page/next' });

      // Assert
      expect(result.activeId).toBe(1);
      expect(result.categories[0].isVisited).toBe(true);
      expect(result.categories[0].isNavigatedAway).toBe(true);
      expect(result.categories[1].isNavigatedAway).toBeFalsy();
      expect(result.isOnReview).toBe(false);
      expect(result.hasNextButton).toBe(true);
      expect(result.hasPrevButton).toBe(true);
    });

    test('marks the state as on review when the last category is passed', () => {
      // Arrange
      const state = buildState({ activeId: 1 });

      // Act
      const result = stepperReducer(state, { type: 'page/next' });

      // Assert
      expect(result.activeId).toBe(2);
      expect(result.isOnReview).toBe(true);
      expect(result.hasNextButton).toBe(false);
    });
  });

  describe('page/prev', () => {
    test('moves the active page back and marks the current category as visited', () => {
      // Arrange
      const state = buildState({ activeId: 1 });

      // Act
      const result = stepperReducer(state, { type: 'page/prev' });

      // Assert
      expect(result.activeId).toBe(0);
      expect(result.categories[1].isVisited).toBe(true);
      expect(result.categories[1].isNavigatedAway).toBe(true);
      expect(result.isOnReview).toBe(false);
      expect(result.hasPrevButton).toBe(false);
    });

    test('does not move before the first page', () => {
      // Arrange
      const state = buildState({ activeId: 0 });

      // Act
      const result = stepperReducer(state, { type: 'page/prev' });

      // Assert
      expect(result.activeId).toBe(0);
      expect(result.hasPrevButton).toBe(false);
    });
  });

  describe('page/to/index', () => {
    test('navigates directly to the given page index', () => {
      // Arrange
      const state = buildState({ activeId: 0, maxReachedStep: 0, validationTrigger: 0 });

      // Act
      const result = stepperReducer(state, {
        type: 'page/to/index',
        payload: { id: 1, targetScope: '#/properties/field1' },
      });

      // Assert
      expect(result.activeId).toBe(1);
      expect(result.targetScope).toBe('#/properties/field1');
      expect(result.maxReachedStep).toBe(1);
      expect(result.validationTrigger).toBe(1);
      expect(result.hasPrevButton).toBe(true);
    });

    test('marks the state as on review when navigating to the review page', () => {
      // Arrange
      const state = buildState({ activeId: 0 });

      // Act
      const result = stepperReducer(state, { type: 'page/to/index', payload: { id: 2 } });

      // Assert
      expect(result.isOnReview).toBe(true);
      expect(result.hasNextButton).toBe(false);
    });
  });

  describe('update/category', () => {
    test('updates the status of the targeted category based on validation', () => {
      // Arrange
      const schema = { type: 'object', required: ['field0'], properties: { field0: { type: 'string' } } };
      const ajv = new Ajv({ allErrors: true });
      const state = buildState();

      // Act
      const result = stepperReducer(state, {
        type: 'update/category',
        payload: { id: 0, ajv, schema, data: { field0: 'value' } },
      });

      // Assert
      expect(result.categories[0].status).toBe(StepStatus.COMPLETED);
      expect(result.categories[0].isCompleted).toBe(true);
      expect(result.categories[0].isValid).toBe(true);
      expect(result.categories[1]).toBe(state.categories[1]);
    });

    test('leaves the category incomplete when required data is missing', () => {
      // Arrange
      const schema = { type: 'object', required: ['field0'], properties: { field0: { type: 'string' } } };
      const ajv = new Ajv({ allErrors: true });
      const state = buildState();

      // Act
      const result = stepperReducer(state, {
        type: 'update/category',
        payload: { id: 0, ajv, schema, data: {} },
      });

      // Assert
      expect(result.categories[0].isCompleted).toBe(false);
      expect(result.categories[0].isValid).toBe(false);
    });

    test('reuses passed errors instead of re-validating the schema', () => {
      // Arrange
      const schema = { type: 'object', required: ['field0'], properties: { field0: { type: 'string' } } };
      const ajv = new Ajv({ allErrors: true });
      const validate = jest.spyOn(ajv, 'validate');
      const state = buildState();

      // Act
      const result = stepperReducer(state, {
        type: 'update/category',
        payload: { id: 0, ajv, schema, data: { field0: 'value' }, errors: [] },
      });

      // Assert
      expect(validate).not.toHaveBeenCalled();
      expect(result.categories[0].status).toBe(StepStatus.COMPLETED);
      expect(result.categories[0].isCompleted).toBe(true);
    });
  });

  describe('set/visited', () => {
    test('marks the specified category as visited', () => {
      // Arrange
      const state = buildState();

      // Act
      const result = stepperReducer(state, { type: 'set/visited', payload: { id: 1 } });

      // Assert
      expect(result.categories[1].isVisited).toBe(true);
      expect(result.categories[0].isVisited).toBe(false);
    });

    test('marks the specified category as navigated away from', () => {
      // This is the action RenderPages fires on Next, Previous and back to the application
      // overview, so it is what actually opens up validation messages for a step.
      // Arrange
      const state = buildState();

      // Act
      const result = stepperReducer(state, { type: 'set/visited', payload: { id: 1 } });

      // Assert
      expect(result.categories[1].isNavigatedAway).toBe(true);
      expect(result.categories[0].isNavigatedAway).toBeFalsy();
    });
  });

  describe('validate/form', () => {
    test('marks the form valid when there are no errors', () => {
      // Arrange
      const state = buildState({ isValid: false });

      // Act
      const result = stepperReducer(state, { type: 'validate/form', payload: { errors: [] } });

      // Assert
      expect(result.isValid).toBe(true);
    });

    test('marks the form invalid when there are errors', () => {
      // Arrange
      const state = buildState({ isValid: true });

      // Act
      const result = stepperReducer(state, {
        type: 'validate/form',
        payload: {
          errors: [{ instancePath: '/field0', message: 'required' }] as unknown as import('ajv').ErrorObject[],
        },
      });

      // Assert
      expect(result.isValid).toBe(false);
    });

    test('returns the same state when the verdict has not moved', () => {
      // JsonForms hands back a new errors array on every keystroke, so this action fires constantly.
      // Arrange
      const state = buildState({ isValid: true });

      // Act
      const result = stepperReducer(state, { type: 'validate/form', payload: { errors: [] } });

      // Assert
      expect(result).toBe(state);
    });

    test('returns the same state when the form was already invalid', () => {
      // Arrange
      const state = buildState({ isValid: false });

      // Act
      const result = stepperReducer(state, {
        type: 'validate/form',
        payload: {
          errors: [{ instancePath: '/field0', message: 'required' }] as unknown as import('ajv').ErrorObject[],
        },
      });

      // Assert
      expect(result).toBe(state);
    });
  });

  describe('toggle/category/review-link', () => {
    test('toggles the review link visibility for the targeted category', () => {
      // Arrange
      const state = buildState();

      // Act
      const result = stepperReducer(state, { type: 'toggle/category/review-link', payload: { id: 0 } });

      // Assert
      expect(result.categories[0].showReviewPageLink).toBe(true);

      // Act again to verify it toggles back off
      const toggledBack = stepperReducer(result, { type: 'toggle/category/review-link', payload: { id: 0 } });

      // Assert
      expect(toggledBack.categories[0].showReviewPageLink).toBe(false);
    });
  });

  describe('update/uischema', () => {
    test('preserves previously visited categories when recomputed state marks them unvisited', () => {
      // Arrange
      const state = buildState({
        categories: [{ ...buildCategory(0), isVisited: true }, buildCategory(1)],
      });
      const newState = buildState({
        categories: [buildCategory(0), buildCategory(1)],
      });

      // Act
      const result = stepperReducer(state, { type: 'update/uischema', payload: { state: newState } });

      // Assert
      expect(result.categories[0].isVisited).toBe(true);
      expect(result.categories[1].isVisited).toBe(false);
    });

    test('keeps the new visited flag when the recomputed category reports visited', () => {
      // Arrange
      const state = buildState({ categories: [buildCategory(0), buildCategory(1)] });
      const newState = buildState({
        categories: [{ ...buildCategory(0), isVisited: true }, buildCategory(1)],
      });

      // Act
      const result = stepperReducer(state, { type: 'update/uischema', payload: { state: newState } });

      // Assert
      expect(result.categories[0].isVisited).toBe(true);
    });

    test('carries a navigated category across a recompute', () => {
      // Arrange
      const state = buildState({
        categories: [{ ...buildCategory(0), isNavigatedAway: true }, buildCategory(1)],
      });
      const newState = buildState({ categories: [buildCategory(0), buildCategory(1)] });

      // Act
      const result = stepperReducer(state, { type: 'update/uischema', payload: { state: newState } });

      // Assert
      expect(result.categories[0].isNavigatedAway).toBe(true);
      expect(result.categories[1].isNavigatedAway).toBe(false);
    });

    test('keeps maxReachedStep and validationTrigger across a recompute', () => {
      // Arrange
      const state = buildState({ activeId: 1, maxReachedStep: 1, validationTrigger: 3 });
      const newState = buildState({ activeId: 1, maxReachedStep: 0, validationTrigger: 0 });

      // Act
      const result = stepperReducer(state, { type: 'update/uischema', payload: { state: newState } });

      // Assert
      expect(result.maxReachedStep).toBe(1);
      expect(result.validationTrigger).toBe(3);
      expect(result.activeId).toBe(1);
    });

    test('does not let a recomputed visited category mark itself navigated (CS-5245)', () => {
      // Entering data anywhere in a step makes the recompute report it visited. That must not
      // promote the step to navigated, or every untouched control on it starts showing errors.
      // Arrange
      const state = buildState({ categories: [buildCategory(0), buildCategory(1)] });
      const newState = buildState({
        categories: [{ ...buildCategory(0), isVisited: true, isNavigatedAway: true }, buildCategory(1)],
      });

      // Act
      const result = stepperReducer(state, { type: 'update/uischema', payload: { state: newState } });

      // Assert
      expect(result.categories[0].isVisited).toBe(true);
      expect(result.categories[0].isNavigatedAway).toBe(false);
    });

    test('returns the same state when the recompute produced an equivalent one', () => {
      // This action fires on every data change, so an equivalent recompute must not publish new
      // state; doing so re-renders every control subscribed to the stepper context.
      // Arrange
      const state = buildState();

      // Act
      const result = stepperReducer(state, {
        type: 'update/uischema',
        payload: { state: buildState() },
      });

      // Assert
      expect(result).toBe(state);
    });

    test('keeps the previous object for a category the recompute did not change', () => {
      // Arrange
      const state = buildState();
      const recomputed = buildState({
        categories: [buildCategory(0), { ...buildCategory(1), isCompleted: true }],
      });

      // Act
      const result = stepperReducer(state, { type: 'update/uischema', payload: { state: recomputed } });

      // Assert
      expect(result).not.toBe(state);
      expect(result.categories[0]).toBe(state.categories[0]);
      expect(result.categories[1]).not.toBe(state.categories[1]);
      expect(result.categories[1].isCompleted).toBe(true);
    });

    test('publishes new state when the recompute changed a category', () => {
      // Arrange
      const state = buildState();
      const recomputed = buildState({
        categories: [{ ...buildCategory(0), status: StepStatus.COMPLETED }, buildCategory(1)],
      });

      // Act
      const result = stepperReducer(state, { type: 'update/uischema', payload: { state: recomputed } });

      // Assert
      expect(result).not.toBe(state);
      expect(result.categories[0].status).toBe(StepStatus.COMPLETED);
    });

    test('does not lose a step the user already reached', () => {
      // Arrange
      const state = buildState({ maxReachedStep: 3 });

      // Act
      const result = stepperReducer(state, {
        type: 'update/uischema',
        payload: { state: buildState({ maxReachedStep: 0 }) },
      });

      // Assert
      expect(result.maxReachedStep).toBe(3);
    });
  });
});
