import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import Access from './access/reducers';
import ApiStatus from './api-status/reducers';
import Config from './config/reducers';
import File from './file/reducers';
import Session from './session/reducers';
import Notifications from './notifications/reducers';
import Tenant from './tenant/reducers';
import ServiceStatus from './health/reducers';

const rootReducer = combineReducers({
  fileService: File,
  apiStatus: ApiStatus,
  session: Session,
  config: Config,
  access: Access,
  tenant: Tenant,
  notifications: Notifications,
  health: ServiceStatus,
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['config', 'session', 'tenant'],
};

export const persistedReducer = persistReducer(persistConfig, rootReducer);
