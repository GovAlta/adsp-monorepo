import { NotifyClient } from 'notifications-node-client';
import { NotificationContent, NotificationProvider } from '../notification';

interface NotifySmsProviderProps {
  NOTIFY_URL: string;
  NOTIFY_API_KEY: string;
  NOTIFY_TEMPLATE_ID: string;
}

export const createNotifySmsProvider = ({
  NOTIFY_URL,
  NOTIFY_API_KEY,
  NOTIFY_TEMPLATE_ID,
}: NotifySmsProviderProps): NotificationProvider => {
  const client = new NotifyClient(NOTIFY_URL, NOTIFY_API_KEY);

  return {
    send: async (notification: NotificationContent) => {
      await client.sendSms(NOTIFY_TEMPLATE_ID, notification.to, {
        personalisation: {
          subject: notification.message.subject,
          body: notification.message.body,
        },
      });
    },
  };
};
