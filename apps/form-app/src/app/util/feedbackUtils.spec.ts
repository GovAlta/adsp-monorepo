import '@testing-library/jest-dom';
import { renderHook } from '@testing-library/react';
import { useHideFeedbackBadge } from './feedbackUtils';

describe('useHideFeedbackBadge', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div class="adsp-fb-badge" data-show="true"></div>';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('hides the feedback badge when requested', () => {
    // Arrange
    const badge = document.querySelector('.adsp-fb-badge');

    // Act
    renderHook(() => useHideFeedbackBadge(true));

    // Assert
    expect(badge).toHaveAttribute('data-show', 'false');
  });

  it('shows the feedback badge when hiding is no longer requested', () => {
    // Arrange
    const badge = document.querySelector('.adsp-fb-badge');
    const { rerender } = renderHook(({ hide }) => useHideFeedbackBadge(hide), {
      initialProps: { hide: true },
    });

    // Act
    rerender({ hide: false });

    // Assert
    expect(badge).toHaveAttribute('data-show', 'true');
  });

  it('restores the feedback badge when the caller unmounts', () => {
    // Arrange
    const badge = document.querySelector('.adsp-fb-badge');
    const { unmount } = renderHook(() => useHideFeedbackBadge(true));

    // Act
    unmount();

    // Assert
    expect(badge).toHaveAttribute('data-show', 'true');
  });
});
