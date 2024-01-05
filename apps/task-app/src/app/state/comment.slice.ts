import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import moment from 'moment';
import { AppState } from './store';
import { getAccessToken } from './user.slice';

export const COMMENT_FEATURE_KEY = 'comment';

interface Topic {
  resourceId: string;
  id: number;
  name: string;
  type: {
    name: string;
  };
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

export const loadTopic = createAsyncThunk(
  'comment/load-topic',
  async ({ resourceId }: { resourceId: string }, { getState, rejectWithValue }) => {
    if (!resourceId) {
      throw new Error('resourceId not specified');
    }

    const { config } = getState() as AppState;
    const commentServiceUrl = config.directory[COMMENT_SERVICE_ID];

    try {
      const token = await getAccessToken();
      const { data } = await axios.get<{ results: Topic[] }>(new URL('/comment/v1/topics', commentServiceUrl).href, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          criteria: JSON.stringify({ resourceIdEquals: resourceId }),
        },
      });

      const [topic] = data.results;

      return topic;
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
    const { comment } = getState() as AppState;
    if (comment.selected !== resourceId && comment.topics[resourceId]) {
      dispatch(loadComments({ topic: comment.topics[resourceId] }));
    }
  }
);

export const addComment = createAsyncThunk(
  'comment/add-comment',
  async ({ topic, comment }: { topic: Topic; comment: NewComment }, { getState, rejectWithValue }) => {
    const { config } = getState() as AppState;
    const commentServiceUrl = config.directory[COMMENT_SERVICE_ID];

    try {
      const token = await getAccessToken();
      const { data } = await axios.post<Comment>(
        new URL(`/comment/v1/topics/${topic.id}/comments`, commentServiceUrl).href,
        comment,
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
  topics: Record<string, Topic>;
  selected: string;
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
  topics: {},
  selected: null,
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
        state.topics[meta.arg.resourceId] = payload;
      })
      .addCase(loadTopic.rejected, (state) => {
        state.busy.loading = false;
      })
      .addCase(selectTopic.fulfilled, (state, { meta }) => {
        state.selected = meta.arg.resourceId;
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
  (state: AppState) => state.comment.selected,
  (topics, selected) => (selected ? topics[selected] : null)
);

export const commentsSelector = createSelector(
  (state: AppState) => state.comment.comments,
  ({ results, next }) => ({
    results: [...results]
      .map((r) => ({ ...r, createdOn: moment(r.createdOn) }))
      .sort((a, b) => b.createdOn.unix() - a.createdOn.unix()),
    next,
  })
);

export const commentExecutingSelector = (state: AppState) => state.comment.busy.executing;

export const commentLoadingSelector = (state: AppState) => state.comment.busy.loading;

export const draftSelector = (state: AppState) => state.comment.draft;
