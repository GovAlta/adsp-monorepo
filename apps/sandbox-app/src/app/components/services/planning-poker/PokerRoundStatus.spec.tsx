import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PokerRoundStatus } from './PokerRoundStatus';

jest.mock('@abgov/react-components', () => ({
  GoabText: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
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

const rows = [
  { userId: 'a1111111', userName: 'Alice Smith', hasVoted: true },
  { userId: 'b2222222', userName: 'Bob Jones', hasVoted: false },
];

describe('PokerRoundStatus', () => {
  test('shows who the table is waiting for', () => {
    // Arrange & Act
    render(<PokerRoundStatus rows={rows} revealing={false} onReveal={jest.fn()} />);

    // Assert
    expect(screen.getByTestId('poker-round-status')).toHaveTextContent('1 of 2 voted · waiting for Bob Jones');
  });

  test('reveals early when asked', () => {
    // Arrange
    const onReveal = jest.fn();
    render(<PokerRoundStatus rows={rows} revealing={false} onReveal={onReveal} />);

    // Act
    fireEvent.click(screen.getByTestId('poker-reveal'));

    // Assert
    expect(onReveal).toHaveBeenCalled();
  });

  test('disables reveal while the reveal runs', () => {
    // Arrange & Act
    render(<PokerRoundStatus rows={rows} revealing={true} onReveal={jest.fn()} />);

    // Assert
    expect(screen.getByTestId('poker-reveal')).toBeDisabled();
  });
});
