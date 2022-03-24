import { combineReducers } from 'redux';
import Config from './config/reducers';
import { noticeReducer, applicationReducer, subscriptionReducer, configurationReducer } from './status/reducers';
import { sessionReducer } from './session/reducers';

export const rootReducer = combineReducers({
  config: Config,
  notice: noticeReducer,
  application: applicationReducer,
  subscription: subscriptionReducer,
  session: sessionReducer,
  configuration: configurationReducer,
});
