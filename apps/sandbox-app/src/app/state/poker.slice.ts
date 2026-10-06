import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { PUSH_SERVICE_ID } from './comment.slice';
import { AppState } from './store';
import { getAccessToken } from './user.slice';

export const POKER_FEATURE_KEY = 'poker';
export const POKER_STREAM_ID = 'planning-poker-updates';
export const POKER_DECK = ['0', '1', '2', '3', '5', '8', '13', '21', '?', 'coffee'];
export const POKER_NICKNAME_MAX_LENGTH = 100;
export const POKER_HEARTBEAT_INTERVAL_MS = 30_000;
// Keep in step with PRESENCE_TIMEOUT_SECONDS in poker-get-state.lua and poker-reveal.lua.
export const POKER_PRESENCE_TIMEOUT_MS = 90_000;

const SCRIPT_SERVICE_ID = 'urn:ads:platform:script-service';
const EVENT_NAMESPACE = 'planning-poker';

export type PokerRoundStatus = 'voting' | 'revealed';

export interface PokerRound {
  roundId: string;
  storyTitle: string;
  storyUrl?: string;
  status: PokerRoundStatus;
  average?: number;
  hasAverage?: boolean;
  consensus?: boolean;
}

export interface PokerParticipant {
  userName: string;
  // Browser time (ms) the player was last heard from; players silent for too long have dropped.
  lastSeen: number;
}

export interface PokerVote {
  userName: string;
  // Only present after the round is revealed.
  vote?: string;
}

export interface PokerSession {
  sessionId: string;
  participants: Record<string, PokerParticipant>;
  round: PokerRound | null;
  votes: Record<string, PokerVote>;
  history: PokerRound[];
}

export interface PokerState extends PokerSession {
  connected: boolean;
  myVote: string | null;
  // Display name chosen by the user; falls back to the Keycloak name when null.
  nickname: string | null;
  busy: {
    loading: boolean;
    starting: boolean;
    voting: boolean;
    revealing: boolean;
    renaming: boolean;
  };
}

interface ParticipantJoinedPayload {
  userId: string;
  userName: string;
}

interface ParticipantLeftPayload {
  userId: string;
}

interface VoteCastPayload {
  roundId: string;
  userId: string;
  userName: string;
}

type Seen<T> = T & { seenAt: number };

interface ScriptParticipant {
  userName: string;
  idleSeconds?: number;
}

interface VotesRevealedPayload extends PokerRound {
  votes: Record<string, PokerVote>;
}

let socket: Socket;

// The script reports idle seconds rather than a time, so the browser and server clocks need not agree.
function toParticipants(
  participants: Record<string, ScriptParticipant>,
  receivedAt: number,
): Record<string, PokerParticipant> {
  return Object.fromEntries(
    Object.entries(participants).map(([userId, { userName, idleSeconds }]) => [
      userId,
      { userName, lastSeen: receivedAt - (idleSeconds || 0) * 1000 },
    ]),
  );
}

// Lua scripts can only build JSON objects, so empty arrays and maps both arrive as {}.
export function parsePokerSession(output: string, receivedAt = Date.now()): PokerSession {
  const session = JSON.parse(output);
  return {
    sessionId: session.sessionId,
    participants: toParticipants(session.participants || {}, receivedAt),
    round: session.round || null,
    votes: session.votes || {},
    history: Array.isArray(session.history) ? session.history : [],
  };
}

// Script errors read "Error encountered during script execution: <chunk>]:<line>: <message>".
export function toScriptErrorMessage(rawMessage: string): string {
  const match = rawMessage?.match(/\]:\d+: (.*)$/s);
  return match ? match[1] : rawMessage;
}

function toPokerRound({
  roundId,
  storyTitle,
  storyUrl,
  status,
  average,
  hasAverage,
  consensus,
}: PokerRound): PokerRound {
  return { roundId, storyTitle, storyUrl, status, average, hasAverage, consensus };
}

function toScriptUrl(state: AppState, scriptId: string): string {
  return new URL(`/script/v1/scripts/${scriptId}`, state.config.directory[SCRIPT_SERVICE_ID]).href;
}

async function runPokerScript(state: AppState, scriptId: string, inputs: Record<string, string>): Promise<string[]> {
  const token = await getAccessToken();
  const { data } = await axios.post<string[]>(
    toScriptUrl(state, scriptId),
    { inputs },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return data;
}

// Participants are identified by email so votes and history read naturally for the team.
export const pokerUserIdSelector = (state: AppState): string | null =>
  state.user.user?.email || state.user.user?.id || null;

function currentUserInputs(state: AppState) {
  const { name, email } = state.user.user;
  return { userId: pokerUserIdSelector(state), userName: state.poker.nickname || name || email };
}

function toNickname(value: string): string | null {
  return value?.trim() || null;
}

// Wraps a script call so failures surface through the feedback slice with a readable message.
function createPokerThunk<Returned, Arg>(type: string, run: (arg: Arg, state: AppState) => Promise<Returned>) {
  return createAsyncThunk<Returned, Arg, { rejectValue: { status: number; message: string } }>(
    type,
    async (arg, { getState, rejectWithValue }) => {
      try {
        return await run(arg, getState() as AppState);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          return rejectWithValue({
            // Network errors have no response; 0 keeps the payload recognizable to the feedback slice.
            status: err.response?.status ?? 0,
            message: toScriptErrorMessage(err.response?.data?.error || err.message),
          });
        }
        throw err;
      }
    },
  );
}

export const loadPokerSession = createPokerThunk('poker/load-session', async (sessionId: string, state) => {
  const [output] = await runPokerScript(state, 'poker-get-state', { sessionId });
  return parsePokerSession(output);
});

// Also the presence heartbeat; returns me so my own seat stays current even if my events are delayed.
export const joinPokerSession = createPokerThunk('poker/join-session', async (sessionId: string, state) => {
  const participant = currentUserInputs(state);
  await runPokerScript(state, 'poker-join', { sessionId, ...participant });
  return { ...participant, seenAt: Date.now() };
});

// Leaving often happens as the tab closes, which cancels axios (XHR) requests; a keepalive fetch outlives the page.
export const leavePokerSession = createAsyncThunk('poker/leave-session', async (sessionId: string, { getState }) => {
  const state = getState() as AppState;
  const token = await getAccessToken();
  const response = await fetch(toScriptUrl(state, 'poker-leave'), {
    method: 'POST',
    keepalive: true,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: { sessionId, userId: pokerUserIdSelector(state) } }),
  });
  if (!response.ok) {
    throw new Error(`Leaving the planning poker session failed with status ${response.status}.`);
  }
});

// The nickname is applied in the pending reducer, so re-joining announces the new name to the session.
export const setPokerNickname = createPokerThunk('poker/set-nickname', async (nickname: string, state) => {
  if (state.poker.sessionId) {
    await runPokerScript(state, 'poker-join', { sessionId: state.poker.sessionId, ...currentUserInputs(state) });
  }
  return toNickname(nickname);
});

export const startPokerRound = createPokerThunk(
  'poker/start-round',
  async ({ storyTitle, storyUrl }: { storyTitle: string; storyUrl?: string }, state) => {
    const round: PokerRound = { roundId: uuidv4(), storyTitle, storyUrl: storyUrl || '', status: 'voting' };
    await runPokerScript(state, 'poker-start-round', {
      sessionId: state.poker.sessionId,
      roundId: round.roundId,
      storyTitle: round.storyTitle,
      storyUrl: round.storyUrl,
      ...currentUserInputs(state),
    });
    return round;
  },
);

export const castPokerVote = createPokerThunk('poker/cast-vote', async (vote: string, state) => {
  await runPokerScript(state, 'poker-cast-vote', {
    sessionId: state.poker.sessionId,
    roundId: state.poker.round?.roundId,
    vote,
    ...currentUserInputs(state),
  });
  return vote;
});

export const revealPokerVotes = createPokerThunk('poker/reveal-votes', async (_: void, state) => {
  const [output] = await runPokerScript(state, 'poker-reveal', {
    sessionId: state.poker.sessionId,
    roundId: state.poker.round?.roundId,
  });
  return JSON.parse(output) as VotesRevealedPayload;
});

export const disconnectPokerStream = createAsyncThunk('poker/disconnect-stream', async (_, { dispatch }) => {
  if (socket) {
    socket.disconnect();
    socket = null;
    dispatch(pokerActions.streamConnectionChanged(false));
  }
});

export const connectPokerStream = createAsyncThunk(
  'poker/connect-stream',
  async (sessionId: string, { dispatch, getState }) => {
    const { config } = getState() as AppState;
    if (socket) {
      socket.disconnect();
    }

    socket = io(`${config.directory[PUSH_SERVICE_ID]}/`, {
      query: {
        stream: POKER_STREAM_ID,
        criteria: JSON.stringify({ context: { sessionId } }),
      },
      withCredentials: true,
      auth: async (cb) => {
        try {
          const token = await getAccessToken();
          cb({ token });
        } catch {
          // Token retrieval failed and connection (using auth result) will also fail after.
          cb(null);
        }
      },
    });

    // Reload on every (re)connect so events missed while disconnected are not lost.
    socket.on('connect', () => {
      dispatch(pokerActions.streamConnectionChanged(true));
      dispatch(loadPokerSession(sessionId));
    });
    socket.on('disconnect', () => {
      dispatch(pokerActions.streamConnectionChanged(false));
    });

    socket.on(`${EVENT_NAMESPACE}:participant-joined`, ({ payload }) =>
      dispatch(pokerActions.participantJoined(payload)),
    );
    socket.on(`${EVENT_NAMESPACE}:participant-left`, ({ payload }) => dispatch(pokerActions.participantLeft(payload)));
    socket.on(`${EVENT_NAMESPACE}:round-started`, ({ payload }) => dispatch(pokerActions.roundStarted(payload)));
    socket.on(`${EVENT_NAMESPACE}:vote-cast`, ({ payload }) => dispatch(pokerActions.voteCast(payload)));
    socket.on(`${EVENT_NAMESPACE}:votes-revealed`, ({ payload }) => dispatch(pokerActions.votesRevealed(payload)));
  },
);

export const initialPokerState: PokerState = {
  sessionId: null,
  connected: false,
  participants: {},
  round: null,
  votes: {},
  history: [],
  myVote: null,
  nickname: null,
  busy: {
    loading: false,
    starting: false,
    voting: false,
    revealing: false,
    renaming: false,
  },
};

function applyParticipantSeen(state: PokerState, { userId, userName, seenAt }: Seen<ParticipantJoinedPayload>) {
  state.participants[userId] = { userName, lastSeen: seenAt };
}

function applyRoundStarted(state: PokerState, round: PokerRound) {
  if (state.round?.roundId !== round.roundId) {
    state.round = toPokerRound(round);
    state.votes = {};
    state.myVote = null;
  }
}

function applyVotesRevealed(state: PokerState, revealed: VotesRevealedPayload) {
  state.round = toPokerRound(revealed);
  state.votes = revealed.votes || {};
  state.history = [state.round, ...state.history.filter(({ roundId }) => roundId !== revealed.roundId)];
}

const pokerSlice = createSlice({
  name: POKER_FEATURE_KEY,
  initialState: initialPokerState,
  reducers: {
    sessionOpened: (state, { payload }: PayloadAction<string>) => {
      if (state.sessionId !== payload) {
        return { ...initialPokerState, sessionId: payload, nickname: state.nickname };
      }
    },
    nicknameRestored: (state, { payload }: PayloadAction<string | null>) => {
      state.nickname = toNickname(payload);
    },
    streamConnectionChanged: (state, { payload }: PayloadAction<boolean>) => {
      state.connected = payload;
    },
    participantJoined: {
      reducer: (state, { payload }: PayloadAction<Seen<ParticipantJoinedPayload>>) => {
        applyParticipantSeen(state, payload);
      },
      prepare: (payload: ParticipantJoinedPayload) => ({ payload: { ...payload, seenAt: Date.now() } }),
    },
    participantLeft: (state, { payload }: PayloadAction<ParticipantLeftPayload>) => {
      delete state.participants[payload.userId];
    },
    participantsPruned: (state, { payload: now }: PayloadAction<number>) => {
      for (const [userId, { lastSeen }] of Object.entries(state.participants)) {
        if (now - lastSeen > POKER_PRESENCE_TIMEOUT_MS) {
          delete state.participants[userId];
        }
      }
    },
    roundStarted: (state, { payload }: PayloadAction<PokerRound>) => {
      applyRoundStarted(state, payload);
    },
    // A vote also proves the voter is still at the table.
    voteCast: {
      reducer: (state, { payload }: PayloadAction<Seen<VoteCastPayload>>) => {
        applyParticipantSeen(state, payload);
        if (state.round?.roundId === payload.roundId && state.round.status === 'voting') {
          state.votes[payload.userId] = { userName: payload.userName };
        }
      },
      prepare: (payload: VoteCastPayload) => ({ payload: { ...payload, seenAt: Date.now() } }),
    },
    votesRevealed: (state, { payload }: PayloadAction<VotesRevealedPayload>) => {
      applyVotesRevealed(state, payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadPokerSession.pending, (state) => {
        state.busy.loading = true;
      })
      .addCase(loadPokerSession.fulfilled, (state, { payload }) => {
        state.busy.loading = false;
        // Ignore a slow response for a session the user has already navigated away from.
        if (payload.sessionId !== state.sessionId) {
          return;
        }
        if (payload.round?.roundId !== state.round?.roundId) {
          state.myVote = null;
        }
        Object.assign(state, payload);
      })
      .addCase(loadPokerSession.rejected, (state) => {
        state.busy.loading = false;
      })
      .addCase(joinPokerSession.fulfilled, (state, { payload, meta }) => {
        if (meta.arg === state.sessionId) {
          applyParticipantSeen(state, payload);
        }
      })
      .addCase(startPokerRound.pending, (state) => {
        state.busy.starting = true;
      })
      .addCase(startPokerRound.fulfilled, (state, { payload }) => {
        applyRoundStarted(state, payload);
        state.busy.starting = false;
      })
      .addCase(startPokerRound.rejected, (state) => {
        state.busy.starting = false;
      })
      .addCase(castPokerVote.pending, (state) => {
        state.busy.voting = true;
      })
      .addCase(castPokerVote.fulfilled, (state, { payload }) => {
        state.myVote = payload;
        state.busy.voting = false;
      })
      .addCase(castPokerVote.rejected, (state) => {
        state.busy.voting = false;
      })
      .addCase(revealPokerVotes.pending, (state) => {
        state.busy.revealing = true;
      })
      .addCase(revealPokerVotes.fulfilled, (state, { payload }) => {
        applyVotesRevealed(state, payload);
        state.busy.revealing = false;
      })
      .addCase(revealPokerVotes.rejected, (state) => {
        state.busy.revealing = false;
      })
      .addCase(setPokerNickname.pending, (state, { meta }) => {
        state.nickname = toNickname(meta.arg);
        state.busy.renaming = true;
      })
      .addCase(setPokerNickname.fulfilled, (state) => {
        state.busy.renaming = false;
      })
      .addCase(setPokerNickname.rejected, (state) => {
        state.busy.renaming = false;
      });
  },
});

export const pokerReducer = pokerSlice.reducer;
export const pokerActions = pokerSlice.actions;

export const pokerSelector = (state: AppState) => state.poker;
