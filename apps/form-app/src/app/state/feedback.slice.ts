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

function toErrorText(value: unknown): string {
  if (value === null || value === undefined) {
    return 'Unknown error';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Error) {
    return value.message;
  }

  if (typeof value === 'object') {
    const candidate = value as {
      message?: unknown;
      errorMessage?: unknown;
      detail?: unknown;
      error?: unknown;
    };

    if (typeof candidate.errorMessage === 'string' && candidate.errorMessage.length > 0) {
      return candidate.errorMessage;
    }

    if (typeof candidate.message === 'string' && candidate.message.length > 0) {
      return candidate.message;
    }

    if (typeof candidate.detail === 'string' && candidate.detail.length > 0) {
      return candidate.detail;
    }

    if (typeof candidate.error === 'string' && candidate.error.length > 0) {
      return candidate.error;
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
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
          message: `Error encountered: ${toErrorText(payload.message)} (${payload.status})`,
          level: 'error',
          in: type,
        };
      } else {
        const payloadText = payload === null || payload === undefined ? '' : toErrorText(payload);
        const errorText = toErrorText(error?.message);
        item = {
          id: uuidv4(),
          message: `Error encountered: ${payloadText || errorText}`,
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
  (feedback) => feedback.items[0],
);
