import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { AppState } from './store';
import { getAccessToken } from './user.slice';

export const COMMENT_FEATURE_KEY = 'comment';
export const PUSH_SERVICE_ID = 'urn:ads:platform:push-service';

interface TopicType {
  id: string;
  name: string;
  readerRoles: string[];
  commenterRoles: string[];
}

interface Topic {
  resourceId: string;
  id: number;
  name: string;
  typeId: string;
  commenters: string[];
}

interface Comment {
  id: number;
  createdOn: string;
  createdBy: {
    id: string;
    name: string;
  };
  title?: string;
  content: string;
}

interface NewComment {
  title?: string;
  content: string;
}

const COMMENT_SERVICE_ID = 'urn:ads:platform:comment-service';

let socket: Socket;

export const disconnectStream = createAsyncThunk('comment/disconnectStream', async (_, { dispatch }) => {
  if (socket && socket.connected) {
    socket.disconnect();
    socket = null;
    dispatch(commentActions.streamConnectionChanged(false));
  }
});

export const connectStream = createAsyncThunk(
  'comment/connectStream',
  async (
    { stream, typeId, topicId }: { stream: string; typeId?: string; topicId?: number },
    { dispatch, getState }
  ) => {
    const state = getState() as AppState;
    const { directory } = state.config;

    // Create the connection if no previous connection or it is disconnected.
    if (socket && socket.connected) {
      socket.disconnect();
    }

    socket = io(`${directory[PUSH_SERVICE_ID]}/`, {
      query: {
        stream,
        criteria: JSON.stringify({
          context: { topicTypeId: typeId, topicId },
        }),
      },
      withCredentials: true,
      auth: async (cb) => {
        try {
          const token = await getAccessToken();
          cb({ token });
        } catch (err) {
          // Token retrieval failed and connection (using auth result) will also fail after.
          cb(null);
        }
      },
    });

    socket.on('connect', () => {
      dispatch(commentActions.streamConnectionChanged(true));
    });

    socket.on('disconnect', () => {
      dispatch(commentActions.streamConnectionChanged(false));
    });

    const onTopicUpdate = ({ topic }: { topic: Topic }) => {
      dispatch(loadTopic({ resourceId: topic.resourceId, typeId }));
    };
    const onCommentUpdate = ({ topic }: { topic: Topic }) => {
      onTopicUpdate({ topic });

      const { comment } = getState() as AppState;
      if (comment.selected.resourceId === topic.resourceId) {
        dispatch(loadComments({ topic: comment.topics[topic.resourceId] }));
      }
    };

    socket.on('comment-service:topic-updated', onTopicUpdate);
    socket.on('comment-service:comment-created', onCommentUpdate);
    socket.on('comment-service:comment-updated', onCommentUpdate);
    socket.on('comment-service:comment-deleted', onCommentUpdate);
  }
);

export const loadTopic = createAsyncThunk(
  'comment/load-topic',
  async ({ resourceId, typeId }: { resourceId: string; typeId: string }, { getState }) => {
    if (!resourceId) {
      throw new Error('resourceId not specified');
    }

    const { config } = getState() as AppState;
    const commentServiceUrl = config.directory[COMMENT_SERVICE_ID];
    // Using comment service is an optional. We will not report error when if the user cannot fetch comments from remote.
    try {
      const token = await getAccessToken();
      const { data } = await axios.get<{ results: (Omit<Topic, 'typeId'> & { type?: TopicType })[] }>(
        new URL('/comment/v1/topics', commentServiceUrl).href,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            criteria: JSON.stringify({ resourceIdEquals: resourceId, typeIdEquals: typeId }),
          },
        }
      );

      const [topic] = data.results;

      return topic;
    } finally {
      // Using comment service is an optional. We will not report error when if the user cannot fetch comments from remote.
    }
  }
);

export const loadComments = createAsyncThunk(
  'comment/load-comments',
  async ({ next, topic }: { next?: string; topic: Topic }, { getState, rejectWithValue }) => {
    const { config } = getState() as AppState;
    const commentServiceUrl = config.directory[COMMENT_SERVICE_ID];

    try {
      const token = await getAccessToken();
      const { data } = await axios.get<{ results: Comment[]; page: { next?: string } }>(
        new URL(`/comment/v1/topics/${topic.id}/comments`, commentServiceUrl).href,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            after: next,
          },
        }
      );

      return data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue({
          status: err.response?.status,
          message: err.response?.data?.errorMessage || err.message,
        });
      } else {
        throw err;
      }
    }
  }
);

export const selectTopic = createAsyncThunk(
  'comment/select-topic',
  async ({ resourceId }: { resourceId: string }, { dispatch, getState }) => {
    const { comment, user } = getState() as AppState;

    let canComment = false;
    let canRead = false;
    const toSelect = comment.topics[resourceId];

    if (toSelect) {
      canComment = toSelect.commenters?.includes(user.user.id);
      canRead = canComment;
    }

    // Load comments if this is changing the selected topic, and user can read the new topic.
    if (comment.selected.resourceId !== resourceId && canRead) {
      dispatch(loadComments({ topic: toSelect }));
    }

    return { canComment, canRead };
  }
);

export const addComment = createAsyncThunk(
  'comment/add-comment',
  async (
    { topic, comment, requiresAttention }: { topic: Topic; comment: NewComment; requiresAttention?: boolean },
    { getState, rejectWithValue }
  ) => {
    const { config } = getState() as AppState;
    const commentServiceUrl = config.directory[COMMENT_SERVICE_ID];

    try {
      const token = await getAccessToken();
      const { data } = await axios.post<Comment>(
        new URL(`/comment/v1/topics/${topic.id}/comments`, commentServiceUrl).href,
        { ...comment, requiresAttention },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue({
          status: err.response?.status,
          message: err.response?.data?.errorMessage || err.message,
        });
      } else {
        throw err;
      }
    }
  }
);

interface CommentState {
  topicTypes: Record<string, TopicType>;
  topics: Record<string, Topic>;
  selected: {
    resourceId: string;
    canRead: boolean;
    canComment: boolean;
  };
  updateStreamConnected: boolean;
  comments: {
    results: Comment[];
    next: string;
  };
  draft: NewComment;
  busy: {
    loading: boolean;
    executing: boolean;
  };
}

const initialCommentState: CommentState = {
  topicTypes: {},
  topics: {},
  selected: {
    resourceId: null,
    canRead: false,
    canComment: false,
  },
  updateStreamConnected: false,
  comments: {
    results: [],
    next: null,
  },
  draft: {
    title: null,
    content: null,
  },
  busy: {
    loading: false,
    executing: false,
  },
};

const commentSlice = createSlice({
  name: COMMENT_FEATURE_KEY,
  initialState: initialCommentState,
  reducers: {
    streamConnectionChanged: (state, { payload }: { payload: boolean }) => {
      state.updateStreamConnected = payload;
    },
    setDraftComment: (state, { payload }: { payload: NewComment }) => {
      state.draft.title = payload.title;
      state.draft.content = payload.content;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTopic.pending, (state) => {
        state.busy.loading = true;
      })
      .addCase(loadTopic.fulfilled, (state, { payload, meta }) => {
        state.busy.loading = false;
        if (payload) {
          const { type, ...topic } = payload;
          state.topics[meta.arg.resourceId] = { ...topic, typeId: type?.id };
          if (type) {
            state.topicTypes[type.id] = type;
          }
        }
      })
      .addCase(loadTopic.rejected, (state) => {
        state.busy.loading = false;
      })
      .addCase(selectTopic.fulfilled, (state, { meta, payload }) => {
        state.selected.resourceId = meta.arg.resourceId;
        state.selected.canComment = payload.canComment;
        state.selected.canRead = payload.canRead;
      })
      .addCase(loadComments.pending, (state, { meta }) => {
        state.busy.loading = true;
        if (!meta.arg.next) {
          state.comments.results = [];
          state.comments.next = null;
        }
      })
      .addCase(loadComments.fulfilled, (state, { payload }) => {
        state.busy.loading = false;

        state.comments.results = [...state.comments.results, ...payload.results];
        state.comments.next = payload.page.next;
      })
      .addCase(loadComments.rejected, (state) => {
        state.busy.loading = false;
      })
      .addCase(addComment.pending, (state) => {
        state.busy.executing = true;
      })
      .addCase(addComment.fulfilled, (state, { payload }) => {
        state.busy.executing = false;
        state.comments.results.unshift(payload);
        state.draft = { title: null, content: null };
      })
      .addCase(addComment.rejected, (state) => {
        state.busy.executing = false;
      });
  },
});

export const commentReducer = commentSlice.reducer;

export const commentActions = commentSlice.actions;

export const topicsSelector = (state: AppState) => state.comment.topics;

export const selectedTopicSelector = createSelector(
  (state: AppState) => state.comment.topics,
  (state: AppState) => state.comment.selected.resourceId,
  (topics, resourceId) => (resourceId ? topics[resourceId] : null)
);

export const commentsSelector = createSelector(
  (state: AppState) => state.comment.comments,
  (state: AppState) => state.user.user?.id,
  ({ results, next }, userId) => ({
    results: [...results]
      .map((r) => ({ ...r, createdOn: new Date(r.createdOn), byCurrentUser: r.createdBy.id === userId }))
      .sort((a, b) => b.createdOn.getTime() - a.createdOn.getTime()),
    next,
  })
);

export const commentExecutingSelector = (state: AppState) => state.comment.busy.executing;

export const commentLoadingSelector = (state: AppState) => state.comment.busy.loading;

export const draftSelector = (state: AppState) => state.comment.draft;

export const canCommentSelector = (state: AppState) => state.comment.selected.canComment;
