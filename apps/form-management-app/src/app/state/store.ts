import { configureStore } from '@reduxjs/toolkit';
import { CONFIG_FEATURE_KEY, configReducer } from './config.slice';
import { CONFIGURATION_FEATURE_KEY, configurationReducer } from './configuration/configuration.slice';
import { FORM_FEATURE_KEY, formReducer } from './form/form.slice';
import { USER_FEATURE_KEY, userReducer } from './user/user.slice';
import { FILE_FEATURE_KEY, fileReducer } from './file/file.slice';
import { PDF_FEATURE_KEY, pdfReducer } from './pdf/pdf.slice';

export const store = configureStore({
  reducer: {
    [CONFIG_FEATURE_KEY]: configReducer,
    [CONFIGURATION_FEATURE_KEY]: configurationReducer,
    [USER_FEATURE_KEY]: userReducer,
    [FORM_FEATURE_KEY]: formReducer,
    [FILE_FEATURE_KEY]: fileReducer,
    [PDF_FEATURE_KEY]: pdfReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
  // Optional Redux store enhancers
  enhancers: [],
  middleware: (getDefault) => getDefault(),
});

export type AppDispatch = typeof store.dispatch;
export type AppState = ReturnType<typeof store.getState>;
