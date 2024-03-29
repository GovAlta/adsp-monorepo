import { NotificationItem } from '@store/notification/models';

export const isDuplicatedNotificationName = (
  coreNotification: Record<string, NotificationItem>,
  notifications: Record<string, NotificationItem>,
  init: NotificationItem,
  name: string
): boolean => {
  if (!notifications) {
    return false;
  }
  const allNames = Object.values({ ...notifications, ...coreNotification })
    .map((notification: NotificationItem): string => {
      return notification?.name;
    })
    .filter((name): string => {
      if (init) {
        // For edit, remove the original name in the name list
        if (init.name !== name) {
          return name;
        }
      } else {
        return name;
      }

      // For lint
      return '';
    });

  return allNames.includes(name);
};
