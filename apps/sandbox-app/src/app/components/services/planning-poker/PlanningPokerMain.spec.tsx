import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PlanningPokerMain } from './PlanningPokerMain';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('../../styled-components', () => ({
  ServiceContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@abgov/react-components', () => ({
  GoabContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  GoabText: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  GoabFormItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  GoabButtonGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  GoabInput: ({
    name,
    value,
    testId,
    onChange,
  }: {
    name: string;
    value: string;
    testId: string;
    onChange: (detail: { name: string; value: string }) => void;
  }) => <input data-testid={testId} value={value} onChange={(e) => onChange({ name, value: e.target.value })} />,
  GoabButton: ({
    children,
    testId,
    disabled,
    onClick,
  }: {
    children: React.ReactNode;
    testId: string;
    disabled: boolean;
    onClick: () => void;
  }) => (
    <button data-testid={testId} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
}));

const SESSION_ID = '8b0f6a52-3c9d-4f1e-9a57-2d6c1e0b7f43';

const renderMain = () => render(<PlanningPokerMain tenantName="autotest" />);

describe('PlanningPokerMain', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('disables join until a valid session link is entered', () => {
    // Arrange & Act
    renderMain();

    // Assert
    expect(screen.getByTestId('poker-join-session')).toBeDisabled();
  });

  test('opens the board for a pasted session link', () => {
    // Arrange
    renderMain();
    fireEvent.change(screen.getByTestId('poker-session-input'), {
      target: { value: `https://sandbox.adsp-uat.alberta.ca/autotest/services/planning-poker/${SESSION_ID}` },
    });

    // Act
    fireEvent.click(screen.getByTestId('poker-join-session'));

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith(`/autotest/services/planning-poker/${SESSION_ID}`);
  });

  test('prefills the nickname saved last time', () => {
    // Arrange
    localStorage.setItem('planning-poker-nickname', 'Captain Estimate');

    // Act
    renderMain();

    // Assert
    expect(screen.getByTestId('poker-join-nickname')).toHaveValue('Captain Estimate');
  });

  test('saves the nickname when joining a session', () => {
    // Arrange
    renderMain();
    fireEvent.change(screen.getByTestId('poker-join-nickname'), { target: { value: 'Captain Estimate' } });

    // Act
    fireEvent.click(screen.getByTestId('poker-new-session'));

    // Assert
    expect(localStorage.getItem('planning-poker-nickname')).toBe('Captain Estimate');
  });

  test('starts a session with a new ID', () => {
    // Arrange
    renderMain();

    // Act
    fireEvent.click(screen.getByTestId('poker-new-session'));

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringMatching(/^\/autotest\/services\/planning-poker\/[0-9a-f-]{36}$/),
    );
  });
});
