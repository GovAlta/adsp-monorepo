import { configureStore } from '@reduxjs/toolkit';
import { COMMENT_FEATURE_KEY, commentReducer } from './comment.slice';
import { CONFIG_FEATURE_KEY, configReducer } from './config.slice';
import { FEEDBACK_FEATURE_KEY, feedbackReducer } from './feedback.slice';
import { FILE_FEATURE_KEY, fileReducer } from './file.slice';
import { QUEUE_FEATURE_KEY, queueReducers } from './queue.slice';
import { TASK_FEATURE_KEY, taskReducer } from './task.slice';
import { USER_FEATURE_KEY, userReducer } from './user.slice';

export const store = configureStore({
  reducer: {
    [COMMENT_FEATURE_KEY]: commentReducer,
    [CONFIG_FEATURE_KEY]: configReducer,
    [FEEDBACK_FEATURE_KEY]: feedbackReducer,
    [FILE_FEATURE_KEY]: fileReducer,
    [QUEUE_FEATURE_KEY]: queueReducers,
    [TASK_FEATURE_KEY]: taskReducer,
    [USER_FEATURE_KEY]: userReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
  // Optional Redux store enhancers
  enhancers: [],
  middleware: (getDefault) => getDefault(),
});

export type AppDispatch = typeof store.dispatch;
export type AppState = ReturnType<typeof store.getState>;
