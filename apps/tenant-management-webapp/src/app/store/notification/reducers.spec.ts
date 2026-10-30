import {
  DeleteNotificationTypeSucceededService,
  UpdateNotificationTypeSucceededService,
} from './actions';
import { NOTIFICATION_INIT, NotificationItem } from './models';
import notificationReducer from './reducers';

const notificationType: NotificationItem = {
  id: 'test-type',
  name: 'Test type',
  subscriberRoles: [],
  channels: ['sms', 'email'],
  events: [],
  publicSubscribe: false,
};

describe('notification reducer mutations', () => {
  it('stores the notification type returned by a mutation', () => {
    const result = notificationReducer(NOTIFICATION_INIT, UpdateNotificationTypeSucceededService(notificationType));

    expect(result.notificationTypes).toEqual({
      [notificationType.id]: { ...notificationType, sortedChannels: ['email', 'sms'] },
    });
  });

  it('removes a deleted notification type immediately', () => {
    const state = {
      ...NOTIFICATION_INIT,
      notificationTypes: { [notificationType.id]: notificationType },
    };

    const result = notificationReducer(state, DeleteNotificationTypeSucceededService(notificationType.id));

    expect(result.notificationTypes).toEqual({});
  });
});
