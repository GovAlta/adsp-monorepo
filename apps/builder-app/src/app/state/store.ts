import { DevToolsEnhancerOptions, configureStore } from '@reduxjs/toolkit';
import { AGENT_FEATURE_KEY, agentReducer } from './agent.slice';
import { CONFIG_FEATURE_KEY, configReducer } from './config.slice';
import { PROJECT_FEATURE_KEY, projectReducer } from './project.slice';
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
    [AGENT_FEATURE_KEY]: agentReducer,
    [CONFIG_FEATURE_KEY]: configReducer,
    [PROJECT_FEATURE_KEY]: projectReducer,
    [USER_FEATURE_KEY]: userReducer,
  },
  devTools: process.env.NODE_ENV !== 'production' || reduxDevToolsLogOnly,
  enhancers: [],
  middleware: (getDefault) => getDefault(),
});

export type AppDispatch = typeof store.dispatch;
export type AppState = ReturnType<typeof store.getState>;
