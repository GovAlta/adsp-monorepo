import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { composeWithDevToolsLogOnlyInProduction as composeWithDevTools } from '@redux-devtools/extension';

import { rootReducer } from './reducers';
import { watchSagas } from './sagas';

const saga = createSagaMiddleware();
const enhancer = composeWithDevTools(applyMiddleware(saga));

export type RootState = ReturnType<typeof rootReducer>;
export const store = createStore(rootReducer, enhancer);

saga.run(watchSagas);
