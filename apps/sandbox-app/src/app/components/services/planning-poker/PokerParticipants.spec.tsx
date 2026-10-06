import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PokerParticipants } from './PokerParticipants';

jest.mock('@abgov/react-components', () => ({
  GoabText: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

const ALICE_ID = 'a1111111-1111-1111-1111-111111111111';
const BOB_ID = 'b2222222-2222-2222-2222-222222222222';

describe('PokerParticipants', () => {
  test('asks to share the link when no one has joined', () => {
    // Arrange & Act
    render(<PokerParticipants rows={[]} revealed={false} myUserId={ALICE_ID} />);

    // Assert
    expect(screen.getByTestId('poker-no-participants')).toBeInTheDocument();
  });

  test('shows a face-down card for a player who has voted', () => {
    // Arrange
    const rows = [{ userId: ALICE_ID, userName: 'Alice Smith', hasVoted: true }];

    // Act
    render(<PokerParticipants rows={rows} revealed={false} myUserId={BOB_ID} />);

    // Assert
    expect(screen.getByTestId(`poker-voted-${ALICE_ID}`).textContent).toBe('');
  });

  test('describes a player who has voted without giving away the vote', () => {
    // Arrange
    const rows = [{ userId: ALICE_ID, userName: 'Alice Smith', hasVoted: true }];

    // Act
    render(<PokerParticipants rows={rows} revealed={false} myUserId={BOB_ID} />);

    // Assert
    expect(screen.getByRole('listitem', { name: 'Alice Smith has voted' })).toBeInTheDocument();
  });

  test('shows a player who has not voted as thinking', () => {
    // Arrange
    const rows = [{ userId: BOB_ID, userName: 'Bob Jones', hasVoted: false }];

    // Act
    render(<PokerParticipants rows={rows} revealed={false} myUserId={ALICE_ID} />);

    // Assert
    expect(screen.getByRole('listitem', { name: 'Bob Jones is still thinking' })).toHaveTextContent('…');
  });

  test('flips each card face up after the reveal', () => {
    // Arrange
    const rows = [{ userId: ALICE_ID, userName: 'Alice Smith', hasVoted: true, vote: 'coffee' }];

    // Act
    render(<PokerParticipants rows={rows} revealed={true} myUserId={BOB_ID} />);

    // Assert
    expect(screen.getByTestId(`poker-vote-${ALICE_ID}`)).toHaveTextContent('☕');
  });

  test('shows a dash for a player who did not vote before the reveal', () => {
    // Arrange
    const rows = [{ userId: BOB_ID, userName: 'Bob Jones', hasVoted: false }];

    // Act
    render(<PokerParticipants rows={rows} revealed={true} myUserId={ALICE_ID} />);

    // Assert
    expect(screen.getByRole('listitem', { name: 'Bob Jones did not vote' })).toHaveTextContent('–');
  });

  test('marks my own seat', () => {
    // Arrange
    const rows = [{ userId: ALICE_ID, userName: 'Alice Smith', hasVoted: false }];

    // Act
    render(<PokerParticipants rows={rows} revealed={false} myUserId={ALICE_ID} />);

    // Assert
    expect(screen.getByText('(you)')).toBeInTheDocument();
  });
});
