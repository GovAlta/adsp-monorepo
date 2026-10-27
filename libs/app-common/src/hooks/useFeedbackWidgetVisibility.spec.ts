import '@testing-library/jest-dom';
import { renderHook } from '@testing-library/react';
import { useFeedbackWidgetVisibility } from './useFeedbackWidgetVisibility';

describe('useFeedbackWidgetVisibility', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div class="adsp-fb-badge" data-show="true"></div>';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('hides the feedback widget when visibility is disabled', () => {
    // Arrange
    const badge = document.querySelector('.adsp-fb-badge');

    // Act
    renderHook(() => useFeedbackWidgetVisibility(false));

    // Assert
    expect(badge).toHaveAttribute('data-show', 'false');
  });

  test('updates feedback widget visibility when the requested visibility changes', () => {
    // Arrange
    const badge = document.querySelector('.adsp-fb-badge');
    const { rerender } = renderHook(({ show }) => useFeedbackWidgetVisibility(show), {
      initialProps: { show: false },
    });

    // Act
    rerender({ show: true });

    // Assert
    expect(badge).toHaveAttribute('data-show', 'true');
  });

  test('restores visibility when a hidden feedback widget caller unmounts', () => {
    // Arrange
    const badge = document.querySelector('.adsp-fb-badge');
    const { unmount } = renderHook(() => useFeedbackWidgetVisibility(false));

    // Act
    unmount();

    // Assert
    expect(badge).toHaveAttribute('data-show', 'true');
  });

  test('hides the feedback widget when a visible feedback widget caller unmounts', () => {
    // Arrange
    const badge = document.querySelector('.adsp-fb-badge');
    const { unmount } = renderHook(() => useFeedbackWidgetVisibility(true));

    // Act
    unmount();

    // Assert
    expect(badge).toHaveAttribute('data-show', 'false');
  });
});
