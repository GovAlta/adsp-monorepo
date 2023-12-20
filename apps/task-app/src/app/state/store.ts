import { configureStore } from '@reduxjs/toolkit';
import { CONFIG_FEATURE_KEY, configReducer } from './config.slice';
import { USER_FEATURE_KEY, userReducer } from './user.slice';
import { TASK_FEATURE_KEY, taskReducer } from './task.slice';
import { QUEUE_FEATURE_KEY, queueReducers } from './queue.slice';

export const store = configureStore({
  reducer: {
    [CONFIG_FEATURE_KEY]: configReducer,
    [USER_FEATURE_KEY]: userReducer,
    [QUEUE_FEATURE_KEY]: queueReducers,
    [TASK_FEATURE_KEY]: taskReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
  // Optional Redux store enhancers
  enhancers: [],
  middleware: (getDefault) => getDefault(),
});

export type AppDispatch = typeof store.dispatch;
export type AppState = ReturnType<typeof store.getState>;
