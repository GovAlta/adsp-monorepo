import { createStore, applyMiddleware, compose } from "redux";
import rootReducer from "./reducers/index";
import createSagaMiddleware from 'redux-saga'
import { watchSagas } from "./sagas";
const saga = createSagaMiddleware();

/* TODO: Keep the following code for a while. We might need it for redux tool setup.
const composeEnhancers =
  typeof window === "object" && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({})
    : compose;
*/

const enhancer = compose(applyMiddleware(saga));

const store = createStore(rootReducer, enhancer);

saga.run(watchSagas);

export default store;