import { configureStore } from '@reduxjs/toolkit';
import { CONFIG_FEATURE_KEY, configReducer } from './config.slice';
import { FEEDBACK_FEATURE_KEY, feedbackReducer } from './feedback.slice';
import { USER_FEATURE_KEY, userReducer } from './user.slice';

export const store = configureStore({
  reducer: {
    [CONFIG_FEATURE_KEY]: configReducer,
    [FEEDBACK_FEATURE_KEY]: feedbackReducer,
    [USER_FEATURE_KEY]: userReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
  // Optional Redux store enhancers
  enhancers: [],
  middleware: (getDefault) => getDefault(),
});

export type AppDispatch = typeof store.dispatch;
export type AppState = ReturnType<typeof store.getState>;
