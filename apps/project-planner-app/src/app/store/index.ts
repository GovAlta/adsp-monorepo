import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { configReducer } from './config/slice';
import { notificationsReducer } from './notifications/reducer';
import { sessionReducer } from './session/slice';

const rootReducer = combineReducers({
  config: configReducer,
  session: sessionReducer,
  notifications: notificationsReducer,
});

export const store = configureStore({ reducer: rootReducer });

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
