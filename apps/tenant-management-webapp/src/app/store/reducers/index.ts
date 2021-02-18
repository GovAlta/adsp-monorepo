import { combineReducers } from 'redux';

import File from './file';
import ServiceMeasure from './serviceMeasure';
import User from './user';
import Config from './config';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const rootReducer = combineReducers({
  file: File,
  serviceMeasure: ServiceMeasure,
  user: User,
  config: Config,
});
const persistConfig = {
  key: 'root',
  storage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export default persistedReducer;
