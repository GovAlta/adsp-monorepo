import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { composeWithDevToolsLogOnlyInProduction as composeWithDevTools } from '@redux-devtools/extension';
import { rootReducer } from './reducers';
import { watchSagas } from './sagas';
import { ErrorNotification } from './notifications/actions';

const sagaMiddleware = createSagaMiddleware();
const enhancer = composeWithDevTools(applyMiddleware(sagaMiddleware));

export type RootState = ReturnType<typeof rootReducer>;
export const store = createStore(rootReducer, enhancer);

sagaMiddleware.run(safeWatchSagas);

export function* safeWatchSagas() {
  try {
    yield* watchSagas();
  } catch (error: any) {
    console.error('Unexpected saga error:', error);
    store.dispatch(ErrorNotification({ error }));
  }
}
