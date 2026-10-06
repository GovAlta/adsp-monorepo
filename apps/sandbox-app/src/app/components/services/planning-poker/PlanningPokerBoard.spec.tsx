import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  initialPokerState,
  POKER_HEARTBEAT_INTERVAL_MS,
  PokerState,
  pokerActions,
  pokerSelector,
  pokerUserIdSelector,
  userActions,
} from '../../../state';
import { PlanningPokerBoard } from './PlanningPokerBoard';
import { AUTO_REVEAL_DELAY_MS, AUTO_REVEAL_FALLBACK_DELAY_MS } from './pokerUtils';

const SESSION_ID = '8b0f6a52-3c9d-4f1e-9a57-2d6c1e0b7f43';
const ALICE_ID = 'alice.smith@gov.ab.ca';
const BOB_ID = 'bob.jones@gov.ab.ca';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useParams: () => ({ tenant: 'autotest', sessionId: '8b0f6a52-3c9d-4f1e-9a57-2d6c1e0b7f43' }),
}));

jest.mock('../../../state', () => ({
  ...jest.requireActual('../../../state'),
  joinPokerSession: jest.fn((sessionId) => ({ type: 'joinPokerSession', payload: sessionId })),
  leavePokerSession: jest.fn((sessionId) => ({ type: 'leavePokerSession', payload: sessionId })),
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
const renderBoard = (poker: Partial<PokerState> = {}, myUserId = ALICE_ID) => {
  const dispatch = jest.fn();
  (useDispatch as jest.Mock).mockReturnValue(dispatch);
  (useSelector as jest.Mock).mockImplementation((selector) => {
    if (selector === pokerSelector) {
      return { ...initialPokerState, sessionId: SESSION_ID, ...poker };
    }
    return selector === pokerUserIdSelector ? myUserId : undefined;
  });
  const view = render(<PlanningPokerBoard />);
  return { dispatch, ...view };
};

const everyoneVoted: Partial<PokerState> = {
  round: votingRound,
  participants: {
    [ALICE_ID]: { userName: 'Alice Smith', lastSeen: 0 },
    [BOB_ID]: { userName: 'Bob Jones', lastSeen: 0 },
  },
  votes: { [ALICE_ID]: { userName: 'Alice Smith' }, [BOB_ID]: { userName: 'Bob Jones' } },
};

describe('PlanningPokerBoard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
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

  test('shows who the table is waiting for while voting', () => {
    // Arrange & Act
    renderBoard({ ...everyoneVoted, votes: { [ALICE_ID]: { userName: 'Alice Smith' } } });

    // Assert
    expect(screen.getByTestId('poker-round-status')).toHaveTextContent('waiting for Bob Jones');
  });

  test('reveals the cards once everyone at the table has voted', () => {
    // Arrange
    jest.useFakeTimers();
    const { dispatch } = renderBoard(everyoneVoted);

    // Act
    act(() => {
      jest.advanceTimersByTime(AUTO_REVEAL_DELAY_MS);
    });

    // Assert
    expect(dispatch).toHaveBeenCalledWith({ type: 'revealPokerVotes' });
  });

  test('leaves the first reveal to the chosen player and only steps in as a fallback', () => {
    // Arrange
    jest.useFakeTimers();
    const { dispatch } = renderBoard(everyoneVoted, BOB_ID);

    // Act
    act(() => {
      jest.advanceTimersByTime(AUTO_REVEAL_FALLBACK_DELAY_MS - 1);
    });

    // Assert
    expect(dispatch).not.toHaveBeenCalledWith({ type: 'revealPokerVotes' });
  });

  test('does not reveal while someone at the table is still thinking', () => {
    // Arrange
    jest.useFakeTimers();
    const { dispatch } = renderBoard({ ...everyoneVoted, votes: { [ALICE_ID]: { userName: 'Alice Smith' } } });

    // Act
    act(() => {
      jest.advanceTimersByTime(AUTO_REVEAL_FALLBACK_DELAY_MS);
    });

    // Assert
    expect(dispatch).not.toHaveBeenCalledWith({ type: 'revealPokerVotes' });
  });

  test('sends a heartbeat so others keep me at the table', () => {
    // Arrange
    jest.useFakeTimers();
    const { dispatch } = renderBoard();
    dispatch.mockClear();

    // Act
    act(() => {
      jest.advanceTimersByTime(POKER_HEARTBEAT_INTERVAL_MS);
    });

    // Assert
    expect(dispatch).toHaveBeenCalledWith({ type: 'joinPokerSession', payload: SESSION_ID });
  });

  test('leaves the session when leaving the board', () => {
    // Arrange
    const { dispatch, unmount } = renderBoard();

    // Act
    unmount();

    // Assert
    expect(dispatch).toHaveBeenCalledWith({ type: 'leavePokerSession', payload: SESSION_ID });
  });

  test('leaves the session when the tab is closed', () => {
    // Arrange
    const { dispatch } = renderBoard();

    // Act
    window.dispatchEvent(new Event('pagehide'));

    // Assert
    expect(dispatch).toHaveBeenCalledWith({ type: 'leavePokerSession', payload: SESSION_ID });
  });

  test('keeps my sign-in alive in the background for long grooming sessions', () => {
    // Arrange & Act
    const { dispatch } = renderBoard();

    // Assert
    expect(dispatch).toHaveBeenCalledWith(userActions.sessionKeepAliveChanged(true));
  });
});
