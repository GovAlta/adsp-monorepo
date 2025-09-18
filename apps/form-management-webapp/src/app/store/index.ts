import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { composeWithDevToolsLogOnlyInProduction as composeWithDevTools } from '@redux-devtools/extension';
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
const enhancer = composeWithDevTools(applyMiddleware(saga));

export type RootState = ReturnType<typeof rootReducer>;
export const store = createStore(rootReducer, enhancer);

saga.run(watchSagas);
