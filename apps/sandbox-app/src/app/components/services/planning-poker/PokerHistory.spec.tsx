import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PokerHistory } from './PokerHistory';

jest.mock('@abgov/react-components', () => ({
  GoabTable: ({ children, testId }: { children: React.ReactNode; testId: string }) => (
    <table data-testid={testId}>{children}</table>
  ),
}));

const revealedRound = {
  roundId: 'r1',
  storyTitle: 'ADSP-123 Login page',
  status: 'revealed' as const,
  average: 5,
  hasAverage: true,
  consensus: true,
};

describe('PokerHistory', () => {
  test('renders nothing before any round is revealed', () => {
    // Arrange & Act
    render(<PokerHistory history={[]} />);

    // Assert
    expect(screen.queryByTestId('poker-history')).not.toBeInTheDocument();
  });

  test('links the story when it has an http link', () => {
    // Arrange
    const round = { ...revealedRound, storyUrl: 'https://jira.gov.ab.ca/browse/ADSP-123' };

    // Act
    render(<PokerHistory history={[round]} />);

    // Assert
    expect(screen.getByRole('link', { name: 'ADSP-123 Login page' })).toHaveAttribute('href', round.storyUrl);
  });

  test('shows the story as text when the link is not http', () => {
    // Arrange
    // eslint-disable-next-line no-script-url -- verifies a script URL is never rendered as a link
    const round = { ...revealedRound, storyUrl: 'javascript:alert(document.cookie)' };

    // Act
    render(<PokerHistory history={[round]} />);

    // Assert
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  test('shows the result of each round', () => {
    // Arrange & Act
    render(<PokerHistory history={[revealedRound]} />);

    // Assert
    expect(screen.getByText('Average 5 · Consensus')).toBeInTheDocument();
  });
});
