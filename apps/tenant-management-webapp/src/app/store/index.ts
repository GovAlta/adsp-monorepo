import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { persistStore } from 'redux-persist';
import { composeWithDevTools } from 'redux-devtools-extension/logOnlyInProduction';
import { createSlice, configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import { persistedReducer } from './reducers';
import { watchSagas } from './sagas';

const saga = createSagaMiddleware();
const enhancer = composeWithDevTools(applyMiddleware(saga));

const middleware = [...getDefaultMiddleware({ thunk: false }), saga];

export type RootState = ReturnType<typeof persistedReducer>;

export const store = configureStore({
  reducer: persistedReducer,
  middleware,
});

//export const store = createStore(persistedReducer, enhancer);
export const persistor = persistStore(store);

saga.run(watchSagas);
