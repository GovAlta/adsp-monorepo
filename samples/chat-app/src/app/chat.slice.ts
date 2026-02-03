import {
  createAction,
  createAsyncThunk,
  createReducer,
  createSelector,
} from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import { UserState } from 'redux-oidc';
import { io, Socket } from 'socket.io-client';
import { ConfigState } from './config.slice';

export const CHAT_FEATURE_KEY = 'chat';

// The message set describes a set of messages to load.
// Top = # of messages to load
// after = the starting point.
export interface MessageSet {
  top: number;
  messagesLoaded: boolean;
  next?: string;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  set: MessageSet;
}

export interface FileContent {
  filename: string;
  urn?: string;
  file?: File;
}

export type MessageContent = (string | FileContent)[];

function instanceOfFileContent(
  object: string | FileContent
): object is FileContent {
  return typeof object !== 'string' && 'filename' in object;
}

export interface Message {
  room: string;
  hash: string;
  timestamp: DateTime;
  message: MessageContent;
  from: {
    id: string;
    name: string;
  };
}

export interface ChatState {
  connected: boolean;
  files: Record<string, string>;
  rooms: Record<string, Room>;
  roomList: string[];
  selectedRoom: string | null;
  messages: Record<string, Message>;
  roomMessages: Record<string, string[]>;
  loadingStatus: Record<string, 'not loaded' | 'loading' | 'loaded' | 'error'>;
  error: string | null;
}

type MessageData = Omit<Message, 'timestamp'> & { timestamp: string };
interface MessageEvent {
  payload: MessageData;
}

export const selectRoom = createAction('chat/selectRoom', (roomId: string) => ({
  payload: roomId,
}));

export const receivedMessage = createAction(
  'chat/receivedMessage',
  (message: Message) => ({ payload: message })
);

export const downloadFile = createAsyncThunk(
  'chat/downloadFile',
  async (
    {
      token,
      content,
    }: {
      token: string;
      content: FileContent;
    },
    { getState }
  ): Promise<string> => {
    const fileServiceUrl = (getState() as { config: ConfigState }).config
      .fileServiceUrl;
    const response = await fetch(
      `${fileServiceUrl}/file/v1${content.urn!
        .split(':')
        .pop()}/download?embed=true&unsafe=true`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const fileReader = new FileReader();
    const blob = await response.blob();
    fileReader.readAsDataURL(blob);
    const dataUrl = await new Promise<string>((resolve, reject) => {
      fileReader.onload = () => {
        resolve(fileReader.result as string);
      };
      fileReader.onerror = () => {
        reject(fileReader.error);
      };
    });

    return dataUrl;
  },
  {
    condition: ({ content }, { getState }) => {
      const { chat } = getState() as { chat: ChatState };
      return content.urn ? !chat.files[content.urn] : false;
    },
  }
);

export const connectedStream = createAction('chat/connectedStream');

export const disconnectedStream = createAction('chat/disconnectedStream');

let socket: Socket;
export const connectStream = createAsyncThunk(
  'chat/connectStream',
  async (token: string, { dispatch, getState }): Promise<void> => {
    const { pushServiceUrl, namespace } = (
      getState() as { config: ConfigState }
    ).config;

    // Create the connection if no previous connection or it is disconnected.
    if (!socket || socket.disconnected) {
      socket = io(`${pushServiceUrl}/${namespace}`, {
        query: {
          stream: 'chat-messages',
        },
        withCredentials: true,
        extraHeaders: { Authorization: `Bearer ${token}` },
      });

      socket.on('connect', () => {
        dispatch(connectedStream());
      });

      socket.on('disconnected', () => {
        dispatch(disconnectedStream());
      });

      socket.on('chat-service:message-sent', ({ payload }: MessageEvent) => {
        const message: Message = {
          timestamp: DateTime.fromISO(payload.timestamp),
          room: payload.room,
          hash: payload.hash,
          message:
            typeof payload.message === 'string'
              ? [payload.message]
              : payload.message,
          from: payload.from,
        };
        dispatch(receivedMessage(message));
        for (const content of message.message) {
          if (instanceOfFileContent(content)) {
            dispatch(downloadFile({ token, content }));
          }
        }
      });
    }
  }
);

export const fetchRooms = createAsyncThunk(
  'chat/fetchRooms',
  async (token: string) => {
    const response = await fetch('/api/chat/v1/rooms', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error('Request chatter role to access...');
    }

    return response.json();
  }
);

export const setRoom = createAsyncThunk(
  'chat/setRoom',
  async (
    {
      id,
      name,
      description,
    }: { id: string; name: string; description: string },
    { getState }
  ) => {
    const state = getState() as {
      user: UserState;
      chat: ChatState;
      config: ConfigState;
    };
    const token = state.user.user!.access_token;
    const response = await fetch(`/api/chat/v1/rooms/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, name, description }),
    });

    return response.json();
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (
    { roomId, top, after }: { roomId: string; top: number; after?: string },
    { dispatch, getState }
  ) => {
    const state = getState() as { user: UserState };
    const token = state.user.user!.access_token;
    const response = await fetch(
      `/api/chat/v1/rooms/${roomId}/messages?top=${top}&after=${after || ''}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const result: {
      results: MessageData[];
      page: { after: string; next: string; size: number };
    } = await response.json();

    const messages: { results: Message[]; next: string } = {
      ...result,
      results: result.results
        .map(({ timestamp: timestampValue, hash, room, message, from }) => {
          const timestamp = DateTime.fromISO(timestampValue);
          const result = {
            timestamp,
            hash,
            room,
            message: typeof message === 'string' ? [message] : message,
            from,
          };

          if (result.message) {
            for (const content of result.message) {
              if (instanceOfFileContent(content)) {
                dispatch(downloadFile({ token, content }));
              }
            }
          }
          return result;
        })
        .reverse(),
      next: result.page.next,
    };

    return messages;
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ message }: { message: MessageContent }, { dispatch, getState }) => {
    const state = getState() as {
      user: UserState;
      chat: ChatState;
      config: ConfigState;
    };
    const token = state.user.user!.access_token;
    const fileServiceUrl = state.config.fileServiceUrl;

    const messageContent: MessageContent = [];
    for (const item of message) {
      if (instanceOfFileContent(item)) {
        const formData = new FormData();
        formData.append('type', 'chat-files');
        formData.append('recordId', state.chat.selectedRoom!);
        formData.append('file', item.file!);
        const fileResponse = await fetch(`${fileServiceUrl}/file/v1/files`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const { filename, urn } = await fileResponse.json();
        dispatch(downloadFile({ token, content: { filename, urn } }));
        messageContent.push({ filename, urn });
      } else if (item) {
        messageContent.push(item);
      }
    }
    const response = await fetch(
      `/api/chat/v1/rooms/${state.chat.selectedRoom}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${state.user.user!.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageContent }),
      }
    );
    const {
      hash,
      timestamp,
      message: resultMessage,
      from,
    } = await response.json();
    return {
      hash,
      room: state.chat.selectedRoom,
      timestamp: DateTime.fromISO(timestamp),
      from,
      message: resultMessage,
    } as Message;
  }
);

export const initialStartState: ChatState = {
  connected: false,
  files: {},
  rooms: {},
  roomList: [],
  selectedRoom: null,
  messages: {},
  roomMessages: {},
  loadingStatus: {},
  error: null,
};

export const chatReducer = createReducer(initialStartState, (builder) => {
  builder
    .addCase(selectRoom, (state, action) => {
      state.selectedRoom = action.payload;
    })
    .addCase(fetchRooms.pending, (state) => {
      state.loadingStatus['rooms'] = 'loading';
    })
    .addCase(fetchRooms.fulfilled, (state, action) => {
      state.loadingStatus['rooms'] = 'loaded';
      state.roomList = action.payload.map((result: { id: string }) => result.id);
      state.rooms = action.payload.reduce(
        (rooms: Record<string, Room>, result: { id: string; name: string; description: string }) => ({
          ...rooms,
          [result.id]: {
            id: result.id,
            name: result.name,
            description: result.description,
            set: { top: 10, messagesLoaded: false },
          },
        }),
        {}
      );
    })
    .addCase(fetchRooms.rejected, (state, action) => {
      state.loadingStatus['rooms'] = 'error';
      state.error = action.error.message ?? 'Unknown error';
    })
    .addCase(setRoom.pending, (state) => {
      state.loadingStatus['set-room'] = 'loading';
    })
    .addCase(setRoom.fulfilled, (state, action) => {
      state.loadingStatus['set-room'] = 'loaded';
      state.roomList = state.roomList.includes(action.meta.arg.id)
        ? state.roomList
        : [...state.roomList, action.meta.arg.id];
      state.rooms = {
        ...state.rooms,
        [action.meta.arg.id]: {
          ...action.payload,
          set: { top: 10, messagesLoaded: false },
        },
      };
    })
    .addCase(setRoom.rejected, (state, action) => {
      state.loadingStatus['set-room'] = 'error';
      state.error = action.error.message ?? 'Unknown error';
    })
    .addCase(connectedStream, (state) => {
      state.connected = true;
    })
    .addCase(disconnectedStream, (state) => {
      state.connected = false;
    })
    .addCase(fetchMessages.pending, (state) => {
      state.loadingStatus['messages'] = 'loading';
    })
    .addCase(fetchMessages.fulfilled, (state, action) => {
      state.loadingStatus['messages'] = 'loaded';
      state.messages = action.payload.results.reduce(
        (messages, result) => ({ ...messages, [result.hash]: result }),
        state.messages
      );
      state.roomMessages[action.meta.arg.roomId] = Array.from(
        new Set([
          ...(state.roomMessages[action.meta.arg.roomId] || []),
          ...action.payload.results.map((result) => result.hash),
        ])
      );
      if (state.selectedRoom && state.rooms[state.selectedRoom]) {
        state.rooms[state.selectedRoom].set = {
          ...state.rooms[state.selectedRoom].set,
          messagesLoaded: true,
          next: action.payload.next,
        };
      }
    })
    .addCase(fetchMessages.rejected, (state, action) => {
      state.loadingStatus['messages'] = 'error';
      state.error = action.error.message ?? 'Unknown error';
    })
    .addCase(sendMessage.pending, (state) => {
      state.loadingStatus['send'] = 'loading';
    })
    .addCase(sendMessage.fulfilled, (state, action) => {
      state.loadingStatus['send'] = 'loaded';
      state.messages[action.payload.hash] = action.payload;
      state.roomMessages[action.payload.room] = Array.from(
        new Set([
          ...(state.roomMessages[action.payload.room] || []),
          action.payload.hash,
        ])
      );
    })
    .addCase(sendMessage.rejected, (state: ChatState, action) => {
      state.loadingStatus['send'] = 'error';
      state.error = action.error.message ?? 'Unknown error';
    })
    .addCase(receivedMessage, (state, action) => {
      state.messages[action.payload.hash] = action.payload;
      state.roomMessages[action.payload.room] = Array.from(
        new Set([
          ...(state.roomMessages[action.payload.room] || []),
          action.payload.hash,
        ])
      );
    })
    .addCase(downloadFile.pending, (state, action) => {
      state.loadingStatus[`download-${action.meta.arg.content.urn}`] =
        'loading';
    })
    .addCase(downloadFile.fulfilled, (state, action) => {
      state.loadingStatus[`download-${action.meta.arg.content.urn}`] = 'loaded';
      state.files = {
        ...state.files,
        [action.meta.arg.content.urn!]: action.payload,
      };
    })
    .addCase(downloadFile.rejected, (state, action) => {
      state.loadingStatus[`download-${action.meta.arg.content.urn}`] = 'error';
      state.error = action.error.message ?? 'Unknown error';
    });
});

export const roomListSelector = createSelector(
  (state: { [CHAT_FEATURE_KEY]: ChatState }) =>
    state[CHAT_FEATURE_KEY].roomList,
  (state: { [CHAT_FEATURE_KEY]: ChatState }) => state[CHAT_FEATURE_KEY].rooms,
  (list, rooms) =>
    list.map((room) => rooms[room]).sort((a, b) => a.name?.localeCompare(b?.name))
);

export const selectedRoomSelector = createSelector(
  (state: { [CHAT_FEATURE_KEY]: ChatState }) =>
    state[CHAT_FEATURE_KEY].selectedRoom,
  (state: { [CHAT_FEATURE_KEY]: ChatState }) => state[CHAT_FEATURE_KEY].rooms,
  (selected, rooms) => (selected ? rooms[selected] : undefined)
);

export const roomMessagesSelector = createSelector(
  (state: { [CHAT_FEATURE_KEY]: ChatState }) =>
    state[CHAT_FEATURE_KEY].selectedRoom,
  (state: { [CHAT_FEATURE_KEY]: ChatState }) =>
    state[CHAT_FEATURE_KEY].roomMessages,
  (state: { [CHAT_FEATURE_KEY]: ChatState }) =>
    state[CHAT_FEATURE_KEY].messages,
  (selected, roomMessages, messages) =>
    selected
      ? roomMessages[selected]
          ?.map((rm) => messages[rm])
          .sort((a, b) => a.timestamp.toUnixInteger() - b.timestamp.toUnixInteger())
      : undefined
);

export const isAdminSelector = createSelector(
  (state: { user: UserState }) => state.user.user,
  (user) => (user as { roles?: string[] } | undefined)?.roles?.includes('chat-admin') ?? false
);
