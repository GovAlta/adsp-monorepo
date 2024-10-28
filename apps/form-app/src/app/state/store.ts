import { DevToolsEnhancerOptions, configureStore } from '@reduxjs/toolkit';
import { CONFIG_FEATURE_KEY, configReducer } from './config.slice';
import { FEEDBACK_FEATURE_KEY, feedbackReducer } from './feedback.slice';
import { FILE_FEATURE_KEY, fileReducer } from './file.slice';
import { USER_FEATURE_KEY, userReducer } from './user.slice';
import { FORM_FEATURE_KEY, formReducer } from './form.slice';
import { COMMENT_FEATURE_KEY, commentReducer } from './comment.slice';
import { PDF_FEATURE_KEY, pdfReducer } from './pdf.slice';

// Use a log only configuration for Redux DevTools in production.
const reduxDevToolsLogOnly: DevToolsEnhancerOptions = {
  features: {
    pause: false,
    lock: false,
    persist: false,
    export: false,
    import: false,
    jump: false,
    skip: false,
    reorder: false,
    dispatch: false,
    test: false,
  },
};

export const store = configureStore({
  reducer: {
    [COMMENT_FEATURE_KEY]: commentReducer,
    [CONFIG_FEATURE_KEY]: configReducer,
    [FEEDBACK_FEATURE_KEY]: feedbackReducer,
    [FILE_FEATURE_KEY]: fileReducer,
    [FORM_FEATURE_KEY]: formReducer,
    [USER_FEATURE_KEY]: userReducer,
    [PDF_FEATURE_KEY]: pdfReducer,
  },
  devTools: process.env.NODE_ENV !== 'production' || reduxDevToolsLogOnly,
  // Optional Redux store enhancers
  enhancers: [],
  middleware: (getDefault) => getDefault(),
});

export type AppDispatch = typeof store.dispatch;
export type AppState = ReturnType<typeof store.getState>;
