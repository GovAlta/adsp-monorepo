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
      const channels = coreItem.channels;
      if (!customEvent) {
        coreEvent.customized = false;
        events.push(coreEvent);
      } else {
        delete customEvent.customized;
        let customized = false;
        for (const channel of channels) {
          const isUpdated =
            JSON.stringify(coreEvent?.templates?.[channel]) !== JSON.stringify(customEvent?.templates?.[channel]);
          if (isUpdated) {
            customized = true;
            break;
          }
        }

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
        if (notificationTypes[notificationTypeName].channels) {
          notificationTypes[notificationTypeName].sortedChannels = notificationTypes[
            notificationTypeName
          ].channels.sort((a, _b) => (a === 'email' ? -1 : 1));
        } else {
          notificationTypes[notificationTypeName].sortedChannels = [];
        }
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

      Object.keys(coreNotificationType).forEach((notificationTypeName) => {
        if (coreNotificationType[notificationTypeName].channels) {
          coreNotificationType[notificationTypeName].sortedChannels = coreNotificationType[
            notificationTypeName
          ].channels.sort((a, _b) => (a === 'email' ? -1 : 1));
        } else {
          coreNotificationType[notificationTypeName].sortedChannels = [];
        }
      });

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
