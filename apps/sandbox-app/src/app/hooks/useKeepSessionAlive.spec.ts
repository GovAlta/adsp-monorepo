import { renderHook } from '@testing-library/react';
import { useDispatch } from 'react-redux';
import { isSessionEndingSoon, userActions } from '../state';
import { useKeepSessionAlive } from './useKeepSessionAlive';

jest.mock('react-redux', () => ({ useDispatch: jest.fn() }));
jest.mock('../state', () => ({
  ...jest.requireActual('../state'),
  isSessionEndingSoon: jest.fn(),
  refreshSession: jest.fn(() => ({ type: 'refreshSession' })),
}));

const CHECK_INTERVAL_MS = 60_000;

describe('useKeepSessionAlive', () => {
  const dispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useDispatch as jest.Mock).mockReturnValue(dispatch);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('hides the expiry warning while the page is open', () => {
    // Arrange & Act
    renderHook(() => useKeepSessionAlive());

    // Assert
    expect(dispatch).toHaveBeenCalledWith(userActions.sessionKeepAliveChanged(true));
  });

  test('brings the expiry warning back once the page is closed', () => {
    // Arrange
    const { unmount } = renderHook(() => useKeepSessionAlive());

    // Act
    unmount();

    // Assert
    expect(dispatch).toHaveBeenLastCalledWith(userActions.sessionKeepAliveChanged(false));
  });

  test('refreshes the session in the background when it is ending soon', () => {
    // Arrange
    (isSessionEndingSoon as jest.Mock).mockReturnValue(true);
    renderHook(() => useKeepSessionAlive());

    // Act
    jest.advanceTimersByTime(CHECK_INTERVAL_MS);

    // Assert
    expect(dispatch).toHaveBeenCalledWith({ type: 'refreshSession' });
  });

  test('does not refresh while plenty of the session is left', () => {
    // Arrange
    (isSessionEndingSoon as jest.Mock).mockReturnValue(false);
    renderHook(() => useKeepSessionAlive());

    // Act
    jest.advanceTimersByTime(CHECK_INTERVAL_MS);

    // Assert
    expect(dispatch).not.toHaveBeenCalledWith({ type: 'refreshSession' });
  });

  test('stops refreshing once the page is closed', () => {
    // Arrange
    (isSessionEndingSoon as jest.Mock).mockReturnValue(true);
    const { unmount } = renderHook(() => useKeepSessionAlive());
    unmount();

    // Act
    jest.advanceTimersByTime(CHECK_INTERVAL_MS);

    // Assert
    expect(dispatch).not.toHaveBeenCalledWith({ type: 'refreshSession' });
  });
});
