import { ActionTypes } from './actions';
import { ServiceStatus } from './models';

const SERVICE_INIT: ServiceStatus = {
  name: '',
  tenantId: '',
};

export default function healthReducer(state: ServiceStatus = SERVICE_INIT, action: ActionTypes): ServiceStatus {
  switch (action.type) {
    case 'health/FETCH_HEALTH_SUCCESS':
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
}
