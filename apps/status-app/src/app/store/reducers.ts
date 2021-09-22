import { combineReducers } from 'redux';
import Config from './config/reducers';
import { noticeReducer, applicationReducer } from './status/reducers'
import { sessionReducer } from './session/reducers'


export const rootReducer = combineReducers({
  config: Config,
  notice: noticeReducer,
  application: applicationReducer,
  session: sessionReducer
});
