import { combineReducers } from 'redux';
import { sampleReducer } from './sample_store/reducers';

export const rootReducer = combineReducers({
  testReducer: sampleReducer,
});
