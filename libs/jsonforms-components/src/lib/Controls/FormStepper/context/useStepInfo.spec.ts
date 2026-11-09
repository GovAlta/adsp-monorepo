import { renderHook } from '@testing-library/react';
import { useStepInfo } from './useStepInfo';
import { CategoryState, StepperContextDataType } from './types';

type StepState = Pick<StepperContextDataType, 'categories' | 'activeId'>;

const categories: CategoryState[] = [0, 1, 2].map((id) => ({ id, label: `Step ${id + 1}`, scopes: [], visible: true }));
const stateAt = (activeId: number): StepState => ({ categories, activeId });

describe('useStepInfo', () => {
  test('returns the step info for the current state', () => {
    // Act
    const { result } = renderHook(() => useStepInfo(stateAt(1)));

    // Assert
    expect(result.current).toEqual({
      isFirstStep: false,
      isLastStep: false,
      currentStep: 2,
      isOnReview: false,
      isOnTaskList: false,
    });
  });

  test('reports on mount', () => {
    // Arrange
    const onStepChange = jest.fn();

    // Act
    renderHook(() => useStepInfo(stateAt(0), onStepChange));

    // Assert
    expect(onStepChange).toHaveBeenCalledTimes(1);
    expect(onStepChange).toHaveBeenCalledWith(expect.objectContaining({ currentStep: 1, isFirstStep: true }));
  });

  test('reports again only when the value changes', () => {
    // Arrange
    const onStepChange = jest.fn();
    const { rerender } = renderHook(({ state }) => useStepInfo(state, onStepChange), {
      initialProps: { state: stateAt(0) },
    });

    // Act
    rerender({ state: stateAt(0) });
    rerender({ state: stateAt(2) });

    // Assert
    expect(onStepChange).toHaveBeenCalledTimes(2);
    expect(onStepChange).toHaveBeenLastCalledWith(expect.objectContaining({ currentStep: 3, isLastStep: true }));
  });

  test('reports to the latest callback without reporting again for a new callback', () => {
    // Arrange
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = renderHook(({ state, onStepChange }) => useStepInfo(state, onStepChange), {
      initialProps: { state: stateAt(0), onStepChange: first },
    });

    // Act
    rerender({ state: stateAt(0), onStepChange: second });
    rerender({ state: stateAt(3), onStepChange: second });

    // Assert
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith(expect.objectContaining({ isOnReview: true }));
  });

  test('works without a callback', () => {
    // Act
    const { result } = renderHook(() => useStepInfo(stateAt(4)));

    // Assert
    expect(result.current.isOnTaskList).toBe(true);
  });
});
