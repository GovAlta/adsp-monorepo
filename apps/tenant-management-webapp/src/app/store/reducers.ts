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
import Event from './event/reducers';
import Notice from './notice/reducers';
import Calendar from './calendar/reducers';
import Script from './script/reducers';
import Configuration, { ConfigurationExport } from './configuration/reducers';
import Stream from './stream/reducers';
import Pdf from './pdf/reducers';
import { serviceRolesReduce as ServiceRoles } from './access/reducers';
import ServiceMetrics from './metrics/reducers';
import Form from './form/reducers';
import Task from './task/reducers';

export const rootReducer = combineReducers({
  fileService: File,
  session: Session,
  config: Config,
  pdf: Pdf,
  form: Form,
  task: Task,
  calendarService: Calendar,
  configuration: Configuration,
  configurationExport: ConfigurationExport,
  access: Access,
  directory: Directory,
  tenant: Tenant,
  notification: Notification,
  subscription: Subscription,
  notifications: Notifications,
  serviceStatus: ServiceStatus,
  event: Event,
  notice: Notice,
  stream: Stream,
  serviceRoles: ServiceRoles,
  serviceMetrics: ServiceMetrics,
  scriptService: Script,
});
