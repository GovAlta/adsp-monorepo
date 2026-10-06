import axios from 'axios';
import { io } from 'socket.io-client';
import {
  POKER_PRESENCE_TIMEOUT_MS,
  POKER_STREAM_RETRY_MS,
  PokerState,
  castPokerVote,
  connectPokerStream,
  disconnectPokerStream,
  initialPokerState,
  joinPokerSession,
  leavePokerSession,
  loadPokerSession,
  parsePokerSession,
  pokerActions,
  pokerReducer,
  pokerUserIdSelector,
  revealPokerVotes,
  setPokerNickname,
  startPokerRound,
  toScriptErrorMessage,
} from './poker.slice';

jest.mock('axios');
jest.mock('socket.io-client', () => ({ io: jest.fn() }));
jest.mock('./user.slice', () => ({
  ...jest.requireActual('./user.slice'),
  getAccessToken: jest.fn(() => Promise.resolve('player-token')),
}));

const axiosMock = axios as jest.Mocked<typeof axios>;
const ioMock = io as jest.Mock;

const SESSION_ID = '8b0f6a52-3c9d-4f1e-9a57-2d6c1e0b7f43';
const ROUND_ID = 'f2c1d7e4-5a6b-4c3d-8e9f-0a1b2c3d4e5f';
const ALICE_ID = 'a1111111-1111-1111-1111-111111111111';
const BOB_ID = 'b2222222-2222-2222-2222-222222222222';
const SCRIPT_SERVICE_URL = 'https://script-service.adsp-uat.alberta.ca';
const PUSH_SERVICE_URL = 'https://push-service.adsp-uat.alberta.ca';
const NOW = 1_790_000_000_000;

const votingRound = { roundId: ROUND_ID, storyTitle: 'ADSP-123 Login page', storyUrl: '', status: 'voting' as const };
const revealedRound = { ...votingRound, status: 'revealed' as const, average: 6.5, hasAverage: true, consensus: false };

const sessionState = (overrides: Partial<PokerState> = {}): PokerState => ({
  ...initialPokerState,
  sessionId: SESSION_ID,
  ...overrides,
});

const appState = (poker: PokerState = sessionState({ round: votingRound })) => ({
  config: {
    directory: {
      'urn:ads:platform:script-service': SCRIPT_SERVICE_URL,
      'urn:ads:platform:push-service': PUSH_SERVICE_URL,
    },
  },
  user: { user: { id: ALICE_ID, name: 'Alice Smith', email: 'alice.smith@gov.ab.ca', roles: [] } },
  poker,
});

const runThunk = async (thunk, state = appState()) => {
  const dispatch = jest.fn();
  const action = await thunk(dispatch, () => state, undefined);
  return { action, dispatch };
};

const scriptError = (message: string) => {
  const error = Object.assign(new Error('Request failed with status code 500'), {
    isAxiosError: true,
    response: { status: 500, data: { error: message } },
  });
  axiosMock.isAxiosError.mockReturnValue(true);
  return error;
};

describe('poker slice', () => {
  let dateNowSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  describe('parsePokerSession', () => {
    test('converts the idle seconds of each player into the time they were last seen', () => {
      // Arrange
      const output = JSON.stringify({
        sessionId: SESSION_ID,
        participants: { [BOB_ID]: { userName: 'Bob Jones', idleSeconds: 20 } },
      });

      // Act
      const session = parsePokerSession(output, NOW);

      // Assert
      expect(session.participants[BOB_ID]).toEqual({ userName: 'Bob Jones', lastSeen: NOW - 20_000 });
    });

    test('converts an empty history object from Lua into an empty array', () => {
      // Arrange
      const output = JSON.stringify({ sessionId: SESSION_ID, participants: {}, votes: {}, history: {} });

      // Act
      const session = parsePokerSession(output);

      // Assert
      expect(session.history).toEqual([]);
    });

    test('defaults the round to null when no round has started', () => {
      // Arrange
      const output = JSON.stringify({ sessionId: SESSION_ID, participants: {}, votes: {}, history: {} });

      // Act
      const session = parsePokerSession(output);

      // Assert
      expect(session.round).toBeNull();
    });

    test('keeps revealed rounds in history order', () => {
      // Arrange
      const output = JSON.stringify({ sessionId: SESSION_ID, history: [revealedRound] });

      // Act
      const session = parsePokerSession(output);

      // Assert
      expect(session.history).toEqual([revealedRound]);
    });
  });

  describe('toScriptErrorMessage', () => {
    test('extracts the Lua error message from a script execution error', () => {
      // Arrange
      const rawMessage =
        'Error encountered during script execution: ./scripts/sandbox.lua:170: [string "-- Casts (or changes)..."]:75: Round r1 is not open for voting.';

      // Act
      const message = toScriptErrorMessage(rawMessage);

      // Assert
      expect(message).toBe('Round r1 is not open for voting.');
    });

    test('returns the original message when it is not a script error', () => {
      // Arrange
      const rawMessage = 'Network Error';

      // Act
      const message = toScriptErrorMessage(rawMessage);

      // Assert
      expect(message).toBe('Network Error');
    });
  });

  describe('reducers', () => {
    test('resets the board when a different session is opened', () => {
      // Arrange
      const state = sessionState({ round: votingRound, myVote: '5' });

      // Act
      const next = pokerReducer(state, pokerActions.sessionOpened('c3333333-3333-3333-3333-333333333333'));

      // Assert
      expect(next).toEqual({ ...initialPokerState, sessionId: 'c3333333-3333-3333-3333-333333333333' });
    });

    test('keeps the board when the same session is opened again', () => {
      // Arrange
      const state = sessionState({ round: votingRound, myVote: '5' });

      // Act
      const next = pokerReducer(state, pokerActions.sessionOpened(SESSION_ID));

      // Assert
      expect(next).toEqual(state);
    });

    test('adds a participant when someone joins', () => {
      // Arrange
      const state = sessionState();

      // Act
      const next = pokerReducer(state, pokerActions.participantJoined({ userId: BOB_ID, userName: 'Bob Jones' }));

      // Assert
      expect(next.participants[BOB_ID]).toEqual({ userName: 'Bob Jones', lastSeen: NOW });
    });

    test('removes a participant who leaves', () => {
      // Arrange
      const state = sessionState({ participants: { [BOB_ID]: { userName: 'Bob Jones', lastSeen: NOW } } });

      // Act
      const next = pokerReducer(state, pokerActions.participantLeft({ userId: BOB_ID }));

      // Assert
      expect(next.participants).toEqual({});
    });

    test('drops players who have not been heard from within the presence timeout', () => {
      // Arrange
      const state = sessionState({
        participants: {
          [ALICE_ID]: { userName: 'Alice Smith', lastSeen: NOW - POKER_PRESENCE_TIMEOUT_MS },
          [BOB_ID]: { userName: 'Bob Jones', lastSeen: NOW - POKER_PRESENCE_TIMEOUT_MS - 1 },
        },
      });

      // Act
      const next = pokerReducer(state, pokerActions.participantsPruned(NOW));

      // Assert
      expect(Object.keys(next.participants)).toEqual([ALICE_ID]);
    });

    test('keeps the same state when no player has dropped', () => {
      // Arrange
      const state = sessionState({ participants: { [BOB_ID]: { userName: 'Bob Jones', lastSeen: NOW } } });

      // Act
      const next = pokerReducer(state, pokerActions.participantsPruned(NOW));

      // Assert
      expect(next).toBe(state);
    });

    test('clears votes and my selection when a new round starts', () => {
      // Arrange
      const state = sessionState({ round: revealedRound, votes: { [BOB_ID]: { userName: 'Bob Jones', vote: '8' } } });
      const newRound = { ...votingRound, roundId: 'd4e5f6a7-b8c9-4d0e-9f1a-2b3c4d5e6f70' };

      // Act
      const next = pokerReducer({ ...state, myVote: '5' }, pokerActions.roundStarted(newRound));

      // Assert
      expect(next).toMatchObject({ round: newRound, votes: {}, myVote: null });
    });

    test('keeps votes when the start event repeats a round already shown', () => {
      // Arrange
      const votes = { [BOB_ID]: { userName: 'Bob Jones' } };
      const state = sessionState({ round: votingRound, votes });

      // Act
      const next = pokerReducer(state, pokerActions.roundStarted(votingRound));

      // Assert
      expect(next.votes).toEqual(votes);
    });

    test('marks a participant as voted without a vote value', () => {
      // Arrange
      const state = sessionState({ round: votingRound });

      // Act
      const next = pokerReducer(
        state,
        pokerActions.voteCast({ roundId: ROUND_ID, userId: BOB_ID, userName: 'Bob Jones' }),
      );

      // Assert
      expect(next.votes[BOB_ID]).toEqual({ userName: 'Bob Jones' });
    });

    test('seats a voter whose join has not arrived yet', () => {
      // Arrange
      const state = sessionState({ round: votingRound });

      // Act
      const next = pokerReducer(
        state,
        pokerActions.voteCast({ roundId: ROUND_ID, userId: BOB_ID, userName: 'Bob Jones' }),
      );

      // Assert
      expect(next.participants[BOB_ID]).toEqual({ userName: 'Bob Jones', lastSeen: NOW });
    });

    test('ignores a vote for a round that is not current', () => {
      // Arrange
      const state = sessionState({ round: votingRound });

      // Act
      const next = pokerReducer(
        state,
        pokerActions.voteCast({ roundId: 'old-round', userId: BOB_ID, userName: 'Bob Jones' }),
      );

      // Assert
      expect(next.votes).toEqual({});
    });

    test('ignores a vote that arrives after the round is revealed', () => {
      // Arrange
      const state = sessionState({ round: revealedRound });

      // Act
      const next = pokerReducer(
        state,
        pokerActions.voteCast({ roundId: ROUND_ID, userId: BOB_ID, userName: 'Bob Jones' }),
      );

      // Assert
      expect(next.votes).toEqual({});
    });

    test('shows the revealed votes', () => {
      // Arrange
      const votes = { [BOB_ID]: { userName: 'Bob Jones', vote: '8' } };

      // Act
      const next = pokerReducer(
        sessionState({ round: votingRound }),
        pokerActions.votesRevealed({ ...revealedRound, votes }),
      );

      // Assert
      expect(next.votes).toEqual(votes);
    });

    test('adds a revealed round to the top of history only once', () => {
      // Arrange
      const state = sessionState({ round: votingRound, history: [revealedRound] });

      // Act
      const next = pokerReducer(state, pokerActions.votesRevealed({ ...revealedRound, votes: {} }));

      // Assert
      expect(next.history).toEqual([revealedRound]);
    });

    test('tracks the push stream connection', () => {
      // Arrange
      const state = sessionState();

      // Act
      const next = pokerReducer(state, pokerActions.streamConnectionChanged(true));

      // Assert
      expect(next.connected).toBe(true);
    });

    test('keeps the reason the push service refused the connection', () => {
      // Arrange
      const state = sessionState({ connected: true });

      // Act
      const next = pokerReducer(state, pokerActions.streamConnectionFailed('Stream not found.'));

      // Assert
      expect(next).toMatchObject({ connected: false, connectionError: 'Stream not found.' });
    });

    test('clears the connection error once live updates connect', () => {
      // Arrange
      const state = sessionState({ connectionError: 'Stream not found.' });

      // Act
      const next = pokerReducer(state, pokerActions.streamConnectionChanged(true));

      // Assert
      expect(next.connectionError).toBeNull();
    });
  });

  describe('thunk results in state', () => {
    test('loads the session state returned by the script', () => {
      // Arrange
      const session = { sessionId: SESSION_ID, participants: {}, round: votingRound, votes: {}, history: [] };

      // Act
      const next = pokerReducer(sessionState(), loadPokerSession.fulfilled(session, 'request', SESSION_ID));

      // Assert
      expect(next.round).toEqual(votingRound);
    });

    test('ignores a slow load for a session the user has left', () => {
      // Arrange
      const session = {
        sessionId: 'c3333333-3333-3333-3333-333333333333',
        participants: {},
        round: votingRound,
        votes: {},
        history: [],
      };

      // Act
      const next = pokerReducer(sessionState(), loadPokerSession.fulfilled(session, 'request', session.sessionId));

      // Assert
      expect(next.round).toBeNull();
    });

    test('remembers the card I picked once the vote is accepted', () => {
      // Arrange
      const state = sessionState({ round: votingRound });

      // Act
      const next = pokerReducer(state, castPokerVote.fulfilled('5', 'request', '5'));

      // Assert
      expect(next.myVote).toBe('5');
    });

    test('shows the started round to the person who started it immediately', () => {
      // Arrange
      const state = sessionState();

      // Act
      const next = pokerReducer(state, startPokerRound.fulfilled(votingRound, 'request', { storyTitle: 'ADSP-123' }));

      // Assert
      expect(next.round).toEqual(votingRound);
    });

    test('marks the reveal as busy while it runs', () => {
      // Arrange
      const state = sessionState({ round: votingRound });

      // Act
      const next = pokerReducer(state, revealPokerVotes.pending('request', undefined));

      // Assert
      expect(next.busy.revealing).toBe(true);
    });

    test('seats me as soon as my join or heartbeat is accepted', () => {
      // Arrange
      const me = { userId: 'alice.smith@gov.ab.ca', userName: 'Alice Smith', seenAt: NOW };

      // Act
      const next = pokerReducer(sessionState(), joinPokerSession.fulfilled(me, 'request', SESSION_ID));

      // Assert
      expect(next.participants[me.userId]).toEqual({ userName: 'Alice Smith', lastSeen: NOW });
    });

    test('ignores a join that finishes after I opened a different session', () => {
      // Arrange
      const me = { userId: 'alice.smith@gov.ab.ca', userName: 'Alice Smith', seenAt: NOW };

      // Act
      const next = pokerReducer(
        sessionState(),
        joinPokerSession.fulfilled(me, 'request', 'c3333333-3333-3333-3333-333333333333'),
      );

      // Assert
      expect(next.participants).toEqual({});
    });
  });

  describe('pokerUserIdSelector', () => {
    test('identifies me by email', () => {
      // Arrange
      const state = appState();

      // Act
      const userId = pokerUserIdSelector(state as never);

      // Assert
      expect(userId).toBe('alice.smith@gov.ab.ca');
    });

    test('returns null when no one is signed in', () => {
      // Arrange
      const state = { ...appState(), user: { user: null } };

      // Act
      const userId = pokerUserIdSelector(state as never);

      // Assert
      expect(userId).toBeNull();
    });
  });

  describe('thunks', () => {
    test('runs the get-state script for the session', async () => {
      // Arrange
      axiosMock.post.mockResolvedValue({ data: [JSON.stringify({ sessionId: SESSION_ID, history: {} })] });

      // Act
      await runThunk(loadPokerSession(SESSION_ID));

      // Assert
      expect(axiosMock.post).toHaveBeenCalledWith(
        `${SCRIPT_SERVICE_URL}/script/v1/scripts/poker-get-state`,
        { inputs: { sessionId: SESSION_ID } },
        { headers: { Authorization: 'Bearer player-token' } },
      );
    });

    test('sends my identity and card when voting', async () => {
      // Arrange
      axiosMock.post.mockResolvedValue({ data: [ROUND_ID] });

      // Act
      await runThunk(castPokerVote('5'));

      // Assert
      expect(axiosMock.post.mock.calls[0][1]).toEqual({
        inputs: {
          sessionId: SESSION_ID,
          roundId: ROUND_ID,
          vote: '5',
          userId: 'alice.smith@gov.ab.ca',
          userName: 'Alice Smith',
        },
      });
    });

    test('falls back to the Keycloak user ID when the token has no email', async () => {
      // Arrange
      axiosMock.post.mockResolvedValue({ data: [SESSION_ID] });
      const state = { ...appState(), user: { user: { id: ALICE_ID, name: 'Alice Smith', email: undefined } } };

      // Act
      await runThunk(castPokerVote('5'), state as ReturnType<typeof appState>);

      // Assert
      expect(axiosMock.post.mock.calls[0][1].inputs.userId).toBe(ALICE_ID);
    });

    test('uses the email as the name when the token has no name', async () => {
      // Arrange
      axiosMock.post.mockResolvedValue({ data: [SESSION_ID] });
      const state = {
        ...appState(),
        user: { user: { id: ALICE_ID, name: undefined, email: 'alice.smith@gov.ab.ca' } },
      };

      // Act
      await runThunk(castPokerVote('5'), state as ReturnType<typeof appState>);

      // Assert
      expect(axiosMock.post.mock.calls[0][1].inputs.userName).toBe('alice.smith@gov.ab.ca');
    });

    test('starts a round with a generated round ID', async () => {
      // Arrange
      axiosMock.post.mockResolvedValue({ data: ['generated'] });

      // Act
      const { action } = await runThunk(startPokerRound({ storyTitle: 'ADSP-123 Login page' }));

      // Assert
      expect(action.payload.roundId).toMatch(/^[0-9a-f-]{36}$/);
    });

    test('returns the revealed round from the reveal script', async () => {
      // Arrange
      const revealed = { ...revealedRound, votes: { [BOB_ID]: { userName: 'Bob Jones', vote: '8' } } };
      axiosMock.post.mockResolvedValue({ data: [JSON.stringify(revealed)] });

      // Act
      const { action } = await runThunk(revealPokerVotes());

      // Assert
      expect(action.payload).toEqual(revealed);
    });

    test('rejects with the readable script error message', async () => {
      // Arrange
      axiosMock.post.mockRejectedValue(
        scriptError('Error encountered during script execution: x]:75: Round r1 is not open for voting.'),
      );

      // Act
      const { action } = await runThunk(castPokerVote('5'));

      // Assert
      expect(action.payload).toEqual({ status: 500, message: 'Round r1 is not open for voting.' });
    });
  });

  describe('leavePokerSession', () => {
    const fetchMock = jest.fn();

    beforeEach(() => {
      global.fetch = fetchMock;
    });

    afterEach(() => {
      delete global.fetch;
    });

    test('sends the leave with keepalive so it survives the tab closing', async () => {
      // Arrange
      fetchMock.mockResolvedValue({ ok: true });

      // Act
      await runThunk(leavePokerSession(SESSION_ID));

      // Assert
      expect(fetchMock).toHaveBeenCalledWith(`${SCRIPT_SERVICE_URL}/script/v1/scripts/poker-leave`, {
        method: 'POST',
        keepalive: true,
        headers: { Authorization: 'Bearer player-token', 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: { sessionId: SESSION_ID, userId: 'alice.smith@gov.ab.ca' } }),
      });
    });

    test('rejects when the script service refuses the leave', async () => {
      // Arrange
      fetchMock.mockResolvedValue({ ok: false, status: 500 });

      // Act
      const { action } = await runThunk(leavePokerSession(SESSION_ID));

      // Assert
      expect(action.error.message).toBe('Leaving the planning poker session failed with status 500.');
    });
  });

  describe('nickname', () => {
    test('restores a saved nickname without surrounding spaces', () => {
      // Arrange
      const state = sessionState();

      // Act
      const next = pokerReducer(state, pokerActions.nicknameRestored('  Captain Estimate '));

      // Assert
      expect(next.nickname).toBe('Captain Estimate');
    });

    test('treats a blank nickname as no nickname', () => {
      // Arrange
      const state = sessionState({ nickname: 'Captain Estimate' });

      // Act
      const next = pokerReducer(state, pokerActions.nicknameRestored('   '));

      // Assert
      expect(next.nickname).toBeNull();
    });

    test('keeps my nickname when I open a different session', () => {
      // Arrange
      const state = sessionState({ nickname: 'Captain Estimate' });

      // Act
      const next = pokerReducer(state, pokerActions.sessionOpened('c3333333-3333-3333-3333-333333333333'));

      // Assert
      expect(next.nickname).toBe('Captain Estimate');
    });

    test('applies a new nickname as soon as it is saved', () => {
      // Arrange
      const state = sessionState();

      // Act
      const next = pokerReducer(state, setPokerNickname.pending('request', 'Captain Estimate'));

      // Assert
      expect(next.nickname).toBe('Captain Estimate');
    });

    test('shows my nickname instead of my name when I vote', async () => {
      // Arrange
      axiosMock.post.mockResolvedValue({ data: [ROUND_ID] });
      const state = appState(sessionState({ round: votingRound, nickname: 'Captain Estimate' }));

      // Act
      await runThunk(castPokerVote('5'), state);

      // Assert
      expect(axiosMock.post.mock.calls[0][1].inputs.userName).toBe('Captain Estimate');
    });

    test('re-joins the session so others see the new nickname', async () => {
      // Arrange
      axiosMock.post.mockResolvedValue({ data: [SESSION_ID] });
      const state = appState(sessionState({ nickname: 'Captain Estimate' }));

      // Act
      await runThunk(setPokerNickname('Captain Estimate'), state);

      // Assert
      expect(axiosMock.post).toHaveBeenCalledWith(
        `${SCRIPT_SERVICE_URL}/script/v1/scripts/poker-join`,
        { inputs: { sessionId: SESSION_ID, userId: 'alice.smith@gov.ab.ca', userName: 'Captain Estimate' } },
        { headers: { Authorization: 'Bearer player-token' } },
      );
    });

    test('does not call the script service when no session is open', async () => {
      // Arrange
      const state = appState({ ...initialPokerState, nickname: 'Captain Estimate' });

      // Act
      await runThunk(setPokerNickname('Captain Estimate'), state);

      // Assert
      expect(axiosMock.post).not.toHaveBeenCalled();
    });
  });

  describe('push stream', () => {
    const socket = { on: jest.fn(), disconnect: jest.fn(), connect: jest.fn(), active: false };
    const handlerFor = (eventName: string) => socket.on.mock.calls.find(([name]) => name === eventName)[1];

    beforeEach(() => {
      ioMock.mockReturnValue(socket);
    });

    test('subscribes to the poker stream filtered by session', async () => {
      // Arrange
      const expectedQuery = {
        stream: 'planning-poker-updates',
        criteria: JSON.stringify({ context: { sessionId: SESSION_ID } }),
      };

      // Act
      await runThunk(connectPokerStream(SESSION_ID));

      // Assert
      expect(ioMock.mock.calls[0][1].query).toEqual(expectedQuery);
    });

    test('connects over websocket only so requests cannot land on a different push service pod', async () => {
      // Arrange & Act
      await runThunk(connectPokerStream(SESSION_ID));

      // Assert
      expect(ioMock.mock.calls[0][1].transports).toEqual(['websocket']);
    });

    test('dispatches a vote-cast event payload to the store', async () => {
      // Arrange
      const payload = { roundId: ROUND_ID, userId: BOB_ID, userName: 'Bob Jones' };
      const { dispatch } = await runThunk(connectPokerStream(SESSION_ID));

      // Act
      handlerFor('planning-poker:vote-cast')({ payload });

      // Assert
      expect(dispatch).toHaveBeenCalledWith(pokerActions.voteCast(payload));
    });

    test('removes a player from the table when their participant-left event arrives', async () => {
      // Arrange
      const payload = { sessionId: SESSION_ID, userId: BOB_ID };
      const { dispatch } = await runThunk(connectPokerStream(SESSION_ID));

      // Act
      handlerFor('planning-poker:participant-left')({ payload });

      // Assert
      expect(dispatch).toHaveBeenCalledWith(pokerActions.participantLeft(payload));
    });

    test('marks the stream live when it connects', async () => {
      // Arrange
      const { dispatch } = await runThunk(connectPokerStream(SESSION_ID));

      // Act
      handlerFor('connect')();

      // Assert
      expect(dispatch).toHaveBeenCalledWith(pokerActions.streamConnectionChanged(true));
    });

    test('reloads the session state when the stream connects so missed events are recovered', async () => {
      // Arrange
      const { dispatch } = await runThunk(connectPokerStream(SESSION_ID));

      // Act
      handlerFor('connect')();

      // Assert
      expect(dispatch).toHaveBeenLastCalledWith(expect.any(Function));
    });

    test('disconnects the socket when leaving the board', async () => {
      // Arrange
      await runThunk(connectPokerStream(SESSION_ID));

      // Act
      await runThunk(disconnectPokerStream());

      // Assert
      expect(socket.disconnect).toHaveBeenCalled();
    });

    test('reports why the push service refused the connection', async () => {
      // Arrange
      const { dispatch } = await runThunk(connectPokerStream(SESSION_ID));

      // Act
      handlerFor('connect_error')(new Error('Stream not found.'));

      // Assert
      expect(dispatch).toHaveBeenCalledWith(pokerActions.streamConnectionFailed('Stream not found.'));
    });

    describe('after the push service refused the connection', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      test('tries to connect again', async () => {
        // Arrange
        await runThunk(connectPokerStream(SESSION_ID));
        handlerFor('connect_error')(new Error('Stream not found.'));

        // Act
        jest.advanceTimersByTime(POKER_STREAM_RETRY_MS);

        // Assert
        expect(socket.connect).toHaveBeenCalled();
      });

      test('stops trying once the board is closed', async () => {
        // Arrange
        await runThunk(connectPokerStream(SESSION_ID));
        handlerFor('connect_error')(new Error('Stream not found.'));
        await runThunk(disconnectPokerStream());

        // Act
        jest.advanceTimersByTime(POKER_STREAM_RETRY_MS);

        // Assert
        expect(socket.connect).not.toHaveBeenCalled();
      });
    });
  });
});
