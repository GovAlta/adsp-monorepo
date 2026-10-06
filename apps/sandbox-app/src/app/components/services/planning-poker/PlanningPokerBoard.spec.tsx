import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useDispatch, useSelector } from 'react-redux';
import { initialPokerState, PokerState, pokerActions, pokerSelector } from '../../../state';
import { PlanningPokerBoard } from './PlanningPokerBoard';

const SESSION_ID = '8b0f6a52-3c9d-4f1e-9a57-2d6c1e0b7f43';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('react-router-dom-v7', () => ({
  useParams: () => ({ tenant: 'autotest', sessionId: '8b0f6a52-3c9d-4f1e-9a57-2d6c1e0b7f43' }),
}));

jest.mock('../../../state', () => ({
  ...jest.requireActual('../../../state'),
  joinPokerSession: jest.fn((sessionId) => ({ type: 'joinPokerSession', payload: sessionId })),
  connectPokerStream: jest.fn((sessionId) => ({ type: 'connectPokerStream', payload: sessionId })),
  disconnectPokerStream: jest.fn(() => ({ type: 'disconnectPokerStream' })),
  castPokerVote: jest.fn((vote) => ({ type: 'castPokerVote', payload: vote })),
  revealPokerVotes: jest.fn(() => ({ type: 'revealPokerVotes' })),
  startPokerRound: jest.fn((round) => ({ type: 'startPokerRound', payload: round })),
  setPokerNickname: jest.fn((nickname) => ({ type: 'setPokerNickname', payload: nickname })),
}));

jest.mock('../../styled-components', () => ({
  ServiceContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('./PokerRoundControls', () => ({
  PokerRoundControls: () => <div data-testid="poker-round-controls" />,
}));

jest.mock('./PokerNickname', () => ({
  PokerNickname: ({ onSave }: { onSave: (nickname: string) => void }) => (
    <button data-testid="poker-save-nickname" onClick={() => onSave('Captain Estimate')} />
  ),
}));

jest.mock('@abgov/react-components', () => ({
  GoabContainer: ({ children, actions }: { children: React.ReactNode; actions: React.ReactNode }) => (
    <div>
      {actions}
      {children}
    </div>
  ),
  GoabText: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  GoabDivider: () => <hr />,
  GoabTable: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  GoabBadge: ({ content, testId }: { content: string; testId?: string }) => <span data-testid={testId}>{content}</span>,
  GoabCallout: ({ children, testId }: { children: React.ReactNode; testId: string }) => (
    <div data-testid={testId}>{children}</div>
  ),
  GoabButton: ({ children, testId, onClick }: { children: React.ReactNode; testId: string; onClick: () => void }) => (
    <button data-testid={testId} onClick={onClick}>
      {children}
    </button>
  ),
}));

const votingRound = { roundId: 'r1', storyTitle: 'ADSP-123 Login page', storyUrl: '', status: 'voting' as const };
const renderBoard = (poker: Partial<PokerState> = {}) => {
  const dispatch = jest.fn();
  (useDispatch as jest.Mock).mockReturnValue(dispatch);
  (useSelector as jest.Mock).mockImplementation((selector) =>
    selector === pokerSelector ? { ...initialPokerState, sessionId: SESSION_ID, ...poker } : undefined,
  );
  const view = render(<PlanningPokerBoard />);
  return { dispatch, ...view };
};

describe('PlanningPokerBoard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('restores my saved nickname before joining the session', () => {
    // Arrange
    localStorage.setItem('planning-poker-nickname', 'Captain Estimate');

    // Act
    const { dispatch } = renderBoard();

    // Assert
    expect(dispatch.mock.calls.slice(1, 3).map(([action]) => action)).toEqual([
      pokerActions.nicknameRestored('Captain Estimate'),
      { type: 'joinPokerSession', payload: SESSION_ID },
    ]);
  });

  test('saves a changed nickname for this and future sessions', () => {
    // Arrange
    const { dispatch } = renderBoard();

    // Act
    fireEvent.click(screen.getByTestId('poker-save-nickname'));

    // Assert
    expect(dispatch).toHaveBeenCalledWith({ type: 'setPokerNickname', payload: 'Captain Estimate' });
  });

  test('remembers a changed nickname in the browser', () => {
    // Arrange
    renderBoard();

    // Act
    fireEvent.click(screen.getByTestId('poker-save-nickname'));

    // Assert
    expect(localStorage.getItem('planning-poker-nickname')).toBe('Captain Estimate');
  });

  test('opens the session from the URL', () => {
    // Arrange & Act
    const { dispatch } = renderBoard();

    // Assert
    expect(dispatch).toHaveBeenCalledWith(pokerActions.sessionOpened(SESSION_ID));
  });

  test('joins the session so others can see me', () => {
    // Arrange & Act
    const { dispatch } = renderBoard();

    // Assert
    expect(dispatch).toHaveBeenCalledWith({ type: 'joinPokerSession', payload: SESSION_ID });
  });

  test('connects to live updates for the session', () => {
    // Arrange & Act
    const { dispatch } = renderBoard();

    // Assert
    expect(dispatch).toHaveBeenCalledWith({ type: 'connectPokerStream', payload: SESSION_ID });
  });

  test('disconnects live updates when leaving the board', () => {
    // Arrange
    const { dispatch, unmount } = renderBoard();

    // Act
    unmount();

    // Assert
    expect(dispatch).toHaveBeenCalledWith({ type: 'disconnectPokerStream' });
  });

  test('waits for someone to start a round', () => {
    // Arrange & Act
    renderBoard();

    // Assert
    expect(screen.getByTestId('poker-waiting')).toBeInTheDocument();
  });

  test('shows the story being estimated', () => {
    // Arrange & Act
    renderBoard({ round: votingRound });

    // Assert
    expect(screen.getByTestId('poker-story')).toHaveTextContent('ADSP-123 Login page');
  });

  test('casts my vote when I pick a card', () => {
    // Arrange
    const { dispatch } = renderBoard({ round: votingRound });

    // Act
    fireEvent.click(screen.getByTestId('poker-card-5'));

    // Assert
    expect(dispatch).toHaveBeenCalledWith({ type: 'castPokerVote', payload: '5' });
  });

  test('gives every participant the round controls', () => {
    // Arrange & Act
    renderBoard();

    // Assert
    expect(screen.getByTestId('poker-round-controls')).toBeInTheDocument();
  });

  test('shows the results once votes are revealed', () => {
    // Arrange & Act
    renderBoard({
      round: { ...votingRound, status: 'revealed', average: 5, hasAverage: true, consensus: true },
      votes: { a1111111: { userName: 'Alice Smith', vote: '5' } },
    });

    // Assert
    expect(screen.getByTestId('poker-results')).toBeInTheDocument();
  });

  test('shows the live badge when connected', () => {
    // Arrange & Act
    renderBoard({ connected: true });

    // Assert
    expect(screen.getByTestId('poker-connection')).toHaveTextContent('Live');
  });

  test('includes the session link to share', () => {
    // Arrange & Act
    renderBoard();

    // Assert
    expect(screen.getByTestId('poker-session-link')).toHaveTextContent(
      `/autotest/services/planning-poker/${SESSION_ID}`,
    );
  });
});
