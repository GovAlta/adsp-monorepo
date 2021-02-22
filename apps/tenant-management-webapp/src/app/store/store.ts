import { createStore, applyMiddleware, compose } from 'redux';
import { persistedReducer } from './reducers/index';
import createSagaMiddleware from 'redux-saga';
import { watchSagas } from './sagas';
import { persistStore } from 'redux-persist';

const saga = createSagaMiddleware();
const enhancer = compose(applyMiddleware(saga));
export const store = createStore(persistedReducer, enhancer);
export const persistor = persistStore(store);

saga.run(watchSagas);
