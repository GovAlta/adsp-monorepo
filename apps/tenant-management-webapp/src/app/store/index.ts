import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import { rootReducer } from './reducers';
import { watchSagas } from './sagas';
import { ErrorNotification } from '@store/notifications/actions';
import { UpdateIndicator } from '@store/session/actions';

const saga = createSagaMiddleware({
  onError(error) {
    // The onError is only for better logging purpose. When the onError is called, the saga is terminated.
    store.dispatch(ErrorNotification({ error: error }));
    console.error(`Unexpected error: ${error?.message}`);
    store.dispatch(UpdateIndicator({ show: false }));
  },
});

export type RootState = ReturnType<typeof rootReducer>;
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: true,
      immutableCheck: false,
      serializableCheck: false,
    }).concat(saga),
});
export type AppDispatch = typeof store.dispatch;

saga.run(watchSagas);
