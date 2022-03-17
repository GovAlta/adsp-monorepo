import { combineReducers } from 'redux';
import Config from './config/reducers';
import Session from './session/reducers';
import Subscription from './subscription/reducers';
import Notifications from './notifications/reducers';
import Notification from './notification/reducers';
import Tenant from './tenant/reducers';

export const rootReducer = combineReducers({
  session: Session,
  config: Config,
  subscription: Subscription,
  notifications: Notifications,
  notification: Notification,
  tenant: Tenant,
});
