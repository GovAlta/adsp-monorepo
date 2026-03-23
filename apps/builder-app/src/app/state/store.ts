import { DevToolsEnhancerOptions, configureStore } from '@reduxjs/toolkit';
import { CONFIG_FEATURE_KEY, configReducer } from './config.slice';
import { USER_FEATURE_KEY, userReducer } from './user.slice';

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
    [CONFIG_FEATURE_KEY]: configReducer,
    [USER_FEATURE_KEY]: userReducer,
  },
  devTools: process.env.NODE_ENV !== 'production' || reduxDevToolsLogOnly,
  enhancers: [],
  middleware: (getDefault) => getDefault(),
});

export type AppDispatch = typeof store.dispatch;
export type AppState = ReturnType<typeof store.getState>;
