import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PokerResults } from './PokerResults';

jest.mock('@abgov/react-components', () => ({
  GoabTable: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  GoabCallout: ({ children, heading, testId }: { children: React.ReactNode; heading: string; testId: string }) => (
    <div data-testid={testId}>
      <h4>{heading}</h4>
      {children}
    </div>
  ),
}));

const revealedRound = {
  roundId: 'r1',
  storyTitle: 'ADSP-123 Login page',
  status: 'revealed' as const,
  average: 6.5,
  hasAverage: true,
  consensus: false,
};
const votes = {
  a1111111: { userName: 'Alice Smith', vote: '5' },
  b2222222: { userName: 'Bob Jones', vote: '8' },
};

describe('PokerResults', () => {
  test('shows the average in the result heading', () => {
    // Arrange & Act
    render(<PokerResults round={revealedRound} votes={votes} />);

    // Assert
    expect(screen.getByRole('heading')).toHaveTextContent('Average 6.5');
  });

  test('prompts discussion when the team did not agree', () => {
    // Arrange & Act
    render(<PokerResults round={revealedRound} votes={votes} />);

    // Assert
    expect(screen.getByTestId('poker-results')).toHaveTextContent('Discuss the highest and lowest votes');
  });

  test('lists one row per card that was picked', () => {
    // Arrange & Act
    render(<PokerResults round={revealedRound} votes={votes} />);

    // Assert
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });
});
