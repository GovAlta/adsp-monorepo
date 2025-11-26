import { configureStore } from '@reduxjs/toolkit';
import { CONFIG_FEATURE_KEY, configReducer } from './config.slice';
import { FORM_FEATURE_KEY, formReducer } from './form/form.slice';
import { USER_FEATURE_KEY, userReducer } from './user/user.slice';

export const store = configureStore({
  reducer: {
    [CONFIG_FEATURE_KEY]: configReducer,
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
