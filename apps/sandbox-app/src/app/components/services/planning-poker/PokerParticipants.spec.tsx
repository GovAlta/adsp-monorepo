import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PokerParticipants } from './PokerParticipants';

jest.mock('@abgov/react-components', () => ({
  GoabText: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  GoabTable: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  GoabBadge: ({ content, testId }: { content: string; testId?: string }) => <span data-testid={testId}>{content}</span>,
}));

const ALICE_ID = 'a1111111-1111-1111-1111-111111111111';
const BOB_ID = 'b2222222-2222-2222-2222-222222222222';

describe('PokerParticipants', () => {
  test('asks to share the link when no one has joined', () => {
    // Arrange & Act
    render(<PokerParticipants rows={[]} revealed={false} />);

    // Assert
    expect(screen.getByTestId('poker-no-participants')).toBeInTheDocument();
  });

  test('shows who has voted without showing the vote', () => {
    // Arrange
    const rows = [{ userId: ALICE_ID, userName: 'Alice Smith', hasVoted: true }];

    // Act
    render(<PokerParticipants rows={rows} revealed={false} />);

    // Assert
    expect(screen.getByTestId(`poker-voted-${ALICE_ID}`)).toHaveTextContent('Voted');
  });

  test('shows a participant who has not voted as thinking', () => {
    // Arrange
    const rows = [{ userId: BOB_ID, userName: 'Bob Jones', hasVoted: false }];

    // Act
    render(<PokerParticipants rows={rows} revealed={false} />);

    // Assert
    expect(screen.getByText('Thinking…')).toBeInTheDocument();
  });

  test('shows each vote after the reveal', () => {
    // Arrange
    const rows = [{ userId: ALICE_ID, userName: 'Alice Smith', hasVoted: true, vote: 'coffee' }];

    // Act
    render(<PokerParticipants rows={rows} revealed={true} />);

    // Assert
    expect(screen.getByTestId(`poker-vote-${ALICE_ID}`)).toHaveTextContent('☕');
  });
});
