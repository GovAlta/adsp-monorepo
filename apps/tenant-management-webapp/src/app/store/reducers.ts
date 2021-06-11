import { combineReducers } from 'redux';
import Access from './access/reducers';
import ApiStatus from './api-status/reducers';
import Config from './config/reducers';
import File from './file/reducers';
import Session from './session/reducers';
import Notifications from './notifications/reducers';
import Tenant from './tenant/reducers';
import ServiceStatus from './status/reducers';
import TenantConfig from './tenantConfig/reducers';

export const rootReducer = combineReducers({
  fileService: File,
  apiStatus: ApiStatus,
  session: Session,
  config: Config,
  access: Access,
  tenant: Tenant,
  notifications: Notifications,
  tenantConfig: TenantConfig,
  serviceStatus: ServiceStatus,
});
