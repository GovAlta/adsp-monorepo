import {
  ActionTypes,
  FETCH_CORE_NOTIFICATION_TYPES_SUCCEEDED,
  FETCH_NOTIFICATION_METRICS_SUCCEEDED,
  FETCH_NOTIFICATION_CONFIGURATION_SUCCEEDED,
} from './actions';
import { NOTIFICATION_INIT, NotificationState, NotificationItem } from './models';

export const combineNotification = (
  coreItem: NotificationItem,
  tenantNotificationType: Record<string, NotificationItem>
): NotificationItem => {
  //if there is a modified version of the core item in the tenant specific notifications
  if (
    Object.values(tenantNotificationType)
      .map((type) => type?.id)
      .includes(coreItem.id)
  ) {
    const events = [];
    coreItem.events.forEach((coreEvent) => {
      const customEvent = tenantNotificationType[coreItem.id].events.find((ev) => ev.name === coreEvent.name);
      if (!customEvent) {
        coreEvent.customized = false;
        events.push(coreEvent);
      } else {
        delete customEvent.customized;
        const customized =
          JSON.stringify(coreEvent?.templates?.email) !== JSON.stringify(customEvent?.templates?.email);
        const returnEvent = customized ? customEvent : coreEvent;
        returnEvent.customized = customized;
        events.push(returnEvent);
      }
    });
    coreItem.events = events;
  } else {
    coreItem.customized = false;
  }

  return coreItem;
};

export default function (state = NOTIFICATION_INIT, action: ActionTypes): NotificationState {
  switch (action.type) {
    case FETCH_NOTIFICATION_CONFIGURATION_SUCCEEDED: {
      const notificationTypes: Record<string, NotificationItem> = action.payload.notificationInfo.data;
      Object.keys(notificationTypes).forEach((notificationTypeName) => {
        notificationTypes[notificationTypeName].channels = notificationTypes[notificationTypeName].channels.sort(
          (a, b) => {
            if (a === 'Email') {
              return -1;
            } else {
              return 1;
            }
          }
        );
      });

      return {
        ...state,
        supportContact: action.payload.contact,
        notificationTypes: notificationTypes,
      };
    }
    case FETCH_CORE_NOTIFICATION_TYPES_SUCCEEDED: {
      const coreNotificationType = action.payload.notificationInfo.data;
      if (state.notificationTypes) {
        Object.values(coreNotificationType).forEach((coreItem) => {
          coreNotificationType[coreItem.id] = combineNotification(coreItem, state.notificationTypes);
        });
      }

      return {
        ...state,
        core: coreNotificationType,
      };
    }
    case FETCH_NOTIFICATION_METRICS_SUCCEEDED: {
      return {
        ...state,
        metrics: action.metrics,
      };
    }
    default:
      return state;
  }
}
