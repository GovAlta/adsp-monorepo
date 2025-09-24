import { combineReducers, Reducer } from 'redux';
import Access from './access/reducers';
import Directory from './directory/reducers';
import File from './file/reducers';
import Notifications from './notifications/reducers';
import Configuration from './configuration/reducers';
import Form from './form/reducers';
import Config from './config/reducers';
import Task from './task/reducers';
import Tenant from './tenant/reducers';
import Session from './session/reducers';
import Calendar from './calendar/reducers';
import Pdf from './pdf/reducers';
import { serviceRolesReduce as ServiceRoles } from './access/reducers';

import { FormState } from './form/model';

export const rootReducer = combineReducers({
  fileService: File,
  form: Form as Reducer<FormState>,
  configuration: Configuration,
  directory: Directory,
  notifications: Notifications,
  config: Config,
  task: Task,
  tenant: Tenant,
  access: Access,
  session: Session,
  calendar: Calendar,
  pdf: Pdf,
  serviceRoles: ServiceRoles,
});
