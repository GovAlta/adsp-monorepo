import { combineReducers } from 'redux';
import Access from './access/reducers';
import Config from './config/reducers';
import Directory from './directory/reducers';
import File from './file/reducers';
import Notification from './notification/reducers';
import Session from './session/reducers';
import Notifications from './notifications/reducers';
import Subscription from './subscription/reducers';
import Tenant from './tenant/reducers';
import ServiceStatus from './status/reducers';
import TenantConfig from './tenantConfig/reducers';
import Event from './event/reducers';
import Notice from './notice/reducers';

export const rootReducer = combineReducers({
  fileService: File,
  session: Session,
  config: Config,
  access: Access,
  directory: Directory,
  tenant: Tenant,
  notification: Notification,
  subscription: Subscription,
  notifications: Notifications,
  tenantConfig: TenantConfig,
  serviceStatus: ServiceStatus,
  event: Event,
  notice: Notice,
});
