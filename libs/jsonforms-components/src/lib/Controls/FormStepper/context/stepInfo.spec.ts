import { getStepInfo, isSameStepInfo } from './stepInfo';
import { CategoryState } from './types';

const category = (id: number, visible = true): CategoryState => ({ id, label: `Step ${id + 1}`, scopes: [], visible });

describe('getStepInfo', () => {
  const categories = [category(0), category(1), category(2)];

  test('reports the first step', () => {
    // Act
    const info = getStepInfo({ categories, activeId: 0 });

    // Assert
    expect(info).toEqual({
      isFirstStep: true,
      isLastStep: false,
      currentStep: 1,
      isOnReview: false,
      isOnTaskList: false,
    });
  });

  test('reports a middle step', () => {
    // Act
    const info = getStepInfo({ categories, activeId: 1 });

    // Assert
    expect(info).toEqual(expect.objectContaining({ isFirstStep: false, isLastStep: false, currentStep: 2 }));
  });

  test('reports the last step', () => {
    // Act
    const info = getStepInfo({ categories, activeId: 2 });

    // Assert
    expect(info).toEqual(expect.objectContaining({ isFirstStep: false, isLastStep: true, currentStep: 3 }));
  });

  test('reports a single-step form as both first and last', () => {
    // Act
    const info = getStepInfo({ categories: [category(0)], activeId: 0 });

    // Assert
    expect(info).toEqual(expect.objectContaining({ isFirstStep: true, isLastStep: true, currentStep: 1 }));
  });

  test('reports the review page with no current step', () => {
    // Act
    const info = getStepInfo({ categories, activeId: 3 });

    // Assert
    expect(info).toEqual({
      isFirstStep: false,
      isLastStep: false,
      currentStep: 0,
      isOnReview: true,
      isOnTaskList: false,
    });
  });

  test('reports the pages variant task list with no current step', () => {
    // Act
    const info = getStepInfo({ categories, activeId: 4 });

    // Assert
    expect(info).toEqual({
      isFirstStep: false,
      isLastStep: false,
      currentStep: 0,
      isOnReview: false,
      isOnTaskList: true,
    });
  });

  test('skips a hidden step before the current one', () => {
    // Arrange
    const withHiddenFirst = [category(0, false), category(1), category(2)];

    // Act
    const info = getStepInfo({ categories: withHiddenFirst, activeId: 1 });

    // Assert
    expect(info).toEqual(expect.objectContaining({ isFirstStep: true, currentStep: 1 }));
  });

  test('treats the last visible step as last when a later step is hidden', () => {
    // Arrange
    const withHiddenLast = [category(0), category(1), category(2, false)];

    // Act
    const info = getStepInfo({ categories: withHiddenLast, activeId: 1 });

    // Assert
    expect(info).toEqual(expect.objectContaining({ isLastStep: true, currentStep: 2 }));
  });
});

describe('isSameStepInfo', () => {
  const info = { isFirstStep: true, isLastStep: false, currentStep: 1, isOnReview: false, isOnTaskList: false };

  test('matches equal values', () => {
    expect(isSameStepInfo(info, { ...info })).toBe(true);
  });

  test('differs when any field changes', () => {
    expect(isSameStepInfo(info, { ...info, currentStep: 2 })).toBe(false);
    expect(isSameStepInfo(info, { ...info, isLastStep: true })).toBe(false);
  });

  test('differs from nothing reported yet', () => {
    expect(isSameStepInfo(undefined, info)).toBe(false);
  });
});
