import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PokerRoundControls } from './PokerRoundControls';

jest.mock('@abgov/react-components', () => ({
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

const votingRound = { roundId: 'r1', storyTitle: 'ADSP-123 Login page', status: 'voting' as const };

const renderControls = (overrides = {}) => {
  const props = {
    round: null,
    starting: false,
    revealing: false,
    onStartRound: jest.fn(),
    onReveal: jest.fn(),
    ...overrides,
  };
  render(<PokerRoundControls {...props} />);
  return props;
};

describe('PokerRoundControls', () => {
  test('disables starting a round until a story is entered', () => {
    // Arrange & Act
    renderControls();

    // Assert
    expect(screen.getByTestId('poker-start-round')).toBeDisabled();
  });

  test('starts a round with the trimmed story title and link', () => {
    // Arrange
    const { onStartRound } = renderControls();
    fireEvent.change(screen.getByTestId('poker-story-title'), { target: { value: '  ADSP-123 Login page ' } });
    fireEvent.change(screen.getByTestId('poker-story-url'), { target: { value: 'https://jira.gov.ab.ca/ADSP-123' } });

    // Act
    fireEvent.click(screen.getByTestId('poker-start-round'));

    // Assert
    expect(onStartRound).toHaveBeenCalledWith('ADSP-123 Login page', 'https://jira.gov.ab.ca/ADSP-123');
  });

  test('clears the story after starting a round', () => {
    // Arrange
    renderControls();
    fireEvent.change(screen.getByTestId('poker-story-title'), { target: { value: 'ADSP-123 Login page' } });

    // Act
    fireEvent.click(screen.getByTestId('poker-start-round'));

    // Assert
    expect(screen.getByTestId('poker-story-title')).toHaveValue('');
  });

  test('disables reveal when no round is open', () => {
    // Arrange & Act
    renderControls();

    // Assert
    expect(screen.getByTestId('poker-reveal')).toBeDisabled();
  });

  test('reveals the votes of an open round', () => {
    // Arrange
    const { onReveal } = renderControls({ round: votingRound });

    // Act
    fireEvent.click(screen.getByTestId('poker-reveal'));

    // Assert
    expect(onReveal).toHaveBeenCalled();
  });
});
