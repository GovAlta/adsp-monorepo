import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { persistStore } from 'redux-persist';
import { composeWithDevTools } from 'redux-devtools-extension/logOnlyInProduction';

import { persistedReducer } from './reducers';
import { watchSagas } from './sagas';

const saga = createSagaMiddleware();
const enhancer = composeWithDevTools(applyMiddleware(saga));

export type RootState = ReturnType<typeof persistedReducer>;
export const store = createStore(persistedReducer, enhancer);
export const persistor = persistStore(store);

saga.run(watchSagas);
