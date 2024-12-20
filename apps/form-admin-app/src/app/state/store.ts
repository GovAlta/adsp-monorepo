import { configureStore } from '@reduxjs/toolkit';
import { COMMENT_FEATURE_KEY, commentReducer } from './comment.slice';
import { CONFIG_FEATURE_KEY, configReducer } from './config.slice';
import { FEEDBACK_FEATURE_KEY, feedbackReducer } from './feedback.slice';
import { FILE_FEATURE_KEY, fileReducer } from './file.slice';
import { USER_FEATURE_KEY, userReducer } from './user.slice';
import { FORM_FEATURE_KEY, formReducer } from './form.slice';

export const store = configureStore({
  reducer: {
    [COMMENT_FEATURE_KEY]: commentReducer,
    [CONFIG_FEATURE_KEY]: configReducer,
    [FEEDBACK_FEATURE_KEY]: feedbackReducer,
    [FILE_FEATURE_KEY]: fileReducer,
    [USER_FEATURE_KEY]: userReducer,
    [FORM_FEATURE_KEY]: formReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
  // Optional Redux store enhancers
  enhancers: [],
  middleware: (getDefault) => getDefault(),
});

export type AppDispatch = typeof store.dispatch;
export type AppState = ReturnType<typeof store.getState>;
