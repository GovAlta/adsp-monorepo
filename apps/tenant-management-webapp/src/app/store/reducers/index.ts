import { combineReducers } from 'redux';

import File from './file';
import ServiceMeasure from './serviceMeasure';
import User from './user';
import Tenant from './tenant';
import Config from './config';
import { persistReducer } from 'redux-persist';
import Access from '../access/reducers'

import storage from 'redux-persist/lib/storage';

const rootReducer = combineReducers({
  file: File,
  serviceMeasure: ServiceMeasure,
  user: User,
  config: Config,
  tenant: Tenant,
  access: Access,
});
const persistConfig = {
  key: 'root',
  storage,
};

export const persistedReducer = persistReducer(persistConfig, rootReducer);
export type RootState = ReturnType<typeof persistedReducer>;
