import { createSelector, createSlice, isRejected } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { AppState } from './store';
import { isAxiosErrorPayload } from './util';

export const FEEDBACK_FEATURE_KEY = 'feedback';

export type FeedbackMessageLevel = 'info' | 'success' | 'warn' | 'error';
export interface FeedbackMessage {
  id: string;
  level: FeedbackMessageLevel;
  message: string;
  in?: string;
}

interface FeedbackState {
  items: FeedbackMessage[];
}

const initialFeedbackState: FeedbackState = {
  items: [],
};

function isFeedbackPayload(payload: unknown): payload is FeedbackMessage {
  const feedback = payload as FeedbackMessage;
  return (
    typeof feedback?.id === 'string' &&
    typeof feedback?.message === 'string' &&
    (feedback.level === 'error' || feedback.level === 'warn')
  );
}

const feedbackSlice = createSlice({
  name: FEEDBACK_FEATURE_KEY,
  initialState: initialFeedbackState,
  reducers: {
    dismissItem: (state) => {
      state.items.shift();
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(isRejected(), (state, { type, payload, error }) => {
      let item: FeedbackMessage;
      if (isFeedbackPayload(payload)) {
        item = payload;
      } else if (isAxiosErrorPayload(payload)) {
        item = {
          id: uuidv4(),
          message: `Error encountered: ${payload.message} (${payload.status}) `,
          level: 'error',
          in: type,
        };
      } else {
        item = {
          id: uuidv4(),
          message: `Error encountered: ${payload || error.message}`,
          level: 'error',
          in: type,
        };
      }

      state.items.push(item);
    });
  },
});

export const feedbackReducer = feedbackSlice.reducer;

export const feedbackActions = feedbackSlice.actions;

export const feedbackSelector = createSelector(
  (state: AppState) => state.feedback,
  (feedback) => feedback.items[0]
);
