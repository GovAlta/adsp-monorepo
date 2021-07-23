import { combineReducers } from 'redux';
import Config from './config/reducers';

export const rootReducer = combineReducers({
  config: Config,
});
