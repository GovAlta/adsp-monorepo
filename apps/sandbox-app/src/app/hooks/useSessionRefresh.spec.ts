import { renderHook } from '@testing-library/react';
import { useDispatch } from 'react-redux';
import { isSessionEndingSoon } from '../state';
import { useSessionRefresh } from './useSessionRefresh';

jest.mock('react-redux', () => ({ useDispatch: jest.fn() }));
jest.mock('../state', () => ({
  isSessionEndingSoon: jest.fn(),
  refreshSession: jest.fn(() => ({ type: 'refreshSession' })),
}));

describe('useSessionRefresh', () => {
  const dispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useDispatch as jest.Mock).mockReturnValue(dispatch);
  });

  test('extends the session when I click near the end of it', () => {
    // Arrange
    (isSessionEndingSoon as jest.Mock).mockReturnValue(true);
    renderHook(() => useSessionRefresh(true));

    // Act
    window.dispatchEvent(new MouseEvent('click'));

    // Assert
    expect(dispatch).toHaveBeenCalledWith({ type: 'refreshSession' });
  });

  test('extends the session when I type near the end of it', () => {
    // Arrange
    (isSessionEndingSoon as jest.Mock).mockReturnValue(true);
    renderHook(() => useSessionRefresh(true));

    // Act
    window.dispatchEvent(new KeyboardEvent('keypress', { key: 'a' }));

    // Assert
    expect(dispatch).toHaveBeenCalledWith({ type: 'refreshSession' });
  });

  test('does not refresh while plenty of the session is left', () => {
    // Arrange
    (isSessionEndingSoon as jest.Mock).mockReturnValue(false);
    renderHook(() => useSessionRefresh(true));

    // Act
    window.dispatchEvent(new MouseEvent('click'));

    // Assert
    expect(dispatch).not.toHaveBeenCalled();
  });

  test('does not refresh when no one is signed in', () => {
    // Arrange
    (isSessionEndingSoon as jest.Mock).mockReturnValue(true);
    renderHook(() => useSessionRefresh(false));

    // Act
    window.dispatchEvent(new MouseEvent('click'));

    // Assert
    expect(dispatch).not.toHaveBeenCalled();
  });

  test('stops listening once the page is closed', () => {
    // Arrange
    (isSessionEndingSoon as jest.Mock).mockReturnValue(true);
    const { unmount } = renderHook(() => useSessionRefresh(true));
    unmount();

    // Act
    window.dispatchEvent(new MouseEvent('click'));

    // Assert
    expect(dispatch).not.toHaveBeenCalled();
  });
});
