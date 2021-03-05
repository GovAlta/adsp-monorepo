import { createStore, applyMiddleware, compose } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { persistStore } from 'redux-persist';

import { persistedReducer } from './reducers';
import { watchSagas } from './sagas';

const saga = createSagaMiddleware();
const enhancer = compose(applyMiddleware(saga));

export type RootState = ReturnType<typeof persistedReducer>;
export const store = createStore(persistedReducer, enhancer);
export const persistor = persistStore(store);

saga.run(watchSagas);
