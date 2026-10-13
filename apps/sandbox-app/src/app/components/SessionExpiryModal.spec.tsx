import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useDispatch } from 'react-redux';
import { getKeycloakExpiry } from '../state';
import { SessionExpiryModal } from './SessionExpiryModal';

jest.mock('react-redux', () => ({ useDispatch: jest.fn() }));
jest.mock('../state', () => ({
  getKeycloakExpiry: jest.fn(),
  refreshSession: jest.fn(() => ({ type: 'refreshSession' })),
}));
jest.mock('@abgov/react-components', () => ({
  GoabModal: ({ open, actions, children }: { open: boolean; actions: React.ReactNode; children: React.ReactNode }) =>
    open ? (
      <div role="dialog">
        {children}
        {actions}
      </div>
    ) : null,
  GoabButtonGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  GoabButton: ({ children, testId, onClick }: { children: React.ReactNode; testId: string; onClick: () => void }) => (
    <button data-testid={testId} onClick={onClick}>
      {children}
    </button>
  ),
}));

const NOW_SECONDS = 1_790_000_000;

describe('SessionExpiryModal', () => {
  const dispatch = jest.fn();

  const renderModal = (secondsLeft: number) => {
    (getKeycloakExpiry as jest.Mock).mockReturnValue(NOW_SECONDS + secondsLeft);
    const onSignOut = jest.fn();
    render(<SessionExpiryModal onSignOut={onSignOut} />);
    return { onSignOut };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(NOW_SECONDS * 1000);
    (useDispatch as jest.Mock).mockReturnValue(dispatch);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('stays hidden while plenty of the session is left', () => {
    // Arrange & Act
    renderModal(10 * 60);

    // Assert
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('warns with a countdown to sign-out when 4 minutes are left', () => {
    // Arrange & Act
    renderModal(4 * 60);

    // Assert
    expect(screen.getByTestId('session-countdown')).toHaveTextContent('180');
  });

  test('counts down every second', () => {
    // Arrange
    renderModal(4 * 60);

    // Act
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Assert
    expect(screen.getByTestId('session-countdown')).toHaveTextContent('175');
  });

  test('extends the session when I choose to stay signed in', () => {
    // Arrange
    renderModal(4 * 60);

    // Act
    fireEvent.click(screen.getByTestId('session-continue'));

    // Assert
    expect(dispatch).toHaveBeenCalledWith({ type: 'refreshSession' });
  });

  test('signs me out when I choose to', () => {
    // Arrange
    const { onSignOut } = renderModal(4 * 60);

    // Act
    fireEvent.click(screen.getByTestId('session-sign-out'));

    // Assert
    expect(onSignOut).toHaveBeenCalled();
  });

  test('signs me out once when only a minute of the session is left', () => {
    // Arrange
    const { onSignOut } = renderModal(61);

    // Act
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Assert
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  test('does nothing when the session expiry is unknown', () => {
    // Arrange
    (getKeycloakExpiry as jest.Mock).mockReturnValue(0);
    const onSignOut = jest.fn();

    // Act
    render(<SessionExpiryModal onSignOut={onSignOut} />);

    // Assert
    expect(onSignOut).not.toHaveBeenCalled();
  });
});
