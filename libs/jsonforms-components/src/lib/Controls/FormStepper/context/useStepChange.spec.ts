import { act, renderHook } from '@testing-library/react';
import { useStepChange } from './useStepChange';
import { StepInfo } from './types';

const step = (currentStep: number): StepInfo => ({
  isFirstStep: currentStep === 1,
  isLastStep: false,
  currentStep,
  isOnReview: false,
  isOnTaskList: false,
});

describe('useStepChange', () => {
  test('has no step until the form reports one', () => {
    // Act
    const { result } = renderHook(() => useStepChange());

    // Assert
    expect(result.current.stepInfo).toBeUndefined();
  });

  test('holds the latest reported step', () => {
    // Arrange
    const { result } = renderHook(() => useStepChange());

    // Act
    act(() => result.current.onStepChange(step(1)));
    act(() => result.current.onStepChange(step(2)));

    // Assert
    expect(result.current.stepInfo).toEqual(step(2));
  });

  test('passes each report to the latest listener', () => {
    // Arrange
    const first = jest.fn();
    const second = jest.fn();
    const { result, rerender } = renderHook(({ listener }) => useStepChange(listener), {
      initialProps: { listener: first },
    });

    // Act
    act(() => result.current.onStepChange(step(1)));
    rerender({ listener: second });
    act(() => result.current.onStepChange(step(2)));

    // Assert
    expect(first).toHaveBeenCalledWith(step(1));
    expect(second).toHaveBeenCalledWith(step(2));
    expect(first).toHaveBeenCalledTimes(1);
  });

  test('keeps the same onStepChange across renders', () => {
    // Arrange
    const { result, rerender } = renderHook(() => useStepChange(() => undefined));
    const initial = result.current.onStepChange;

    // Act
    rerender();

    // Assert
    expect(result.current.onStepChange).toBe(initial);
  });
});
