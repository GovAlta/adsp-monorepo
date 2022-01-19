import { ActionTypes, FETCH_CORE_NOTIFICATION_TYPE_SUCCEEDED, FETCH_NOTIFICATION_TYPE_SUCCEEDED } from './actions';
import { NOTIFICATION_INIT, NotificationService } from './models';

export default function (state = NOTIFICATION_INIT, action: ActionTypes): NotificationService {
  switch (action.type) {
    case FETCH_NOTIFICATION_TYPE_SUCCEEDED:
      return {
        ...state,
        notificationTypes: action.payload.notificationInfo.data,
      };
    case FETCH_CORE_NOTIFICATION_TYPE_SUCCEEDED: {
      const coreNotification = action.payload.notificationInfo.data;

      Object.values(coreNotification).forEach((coreType) => {
        if (
          Object.values(state.notificationTypes)
            .map((type) => type?.id)
            .includes(coreType.id)
        ) {
          coreNotification[coreType.id] = state.notificationTypes[coreType.id];
          coreNotification[coreType.id].customized = true;
        }
      });

      return {
        ...state,
        core: action.payload.notificationInfo.data,
      };
    }
    default:
      return state;
  }
}
