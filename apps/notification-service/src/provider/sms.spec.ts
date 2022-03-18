import { NotifyClient } from 'notifications-node-client';
import { createNotifySmsProvider } from './sms';

jest.mock('notifications-node-client');

describe('createABNotifySmsProvider', () => {
  it('can create provider', () => {
    const provider = createNotifySmsProvider({
      NOTIFY_URL: 'https://notify',
      NOTIFY_API_KEY: 'my-key',
      NOTIFY_TEMPLATE_ID: '123-fake-template',
    });

    expect(provider).toBeTruthy();
  });

  describe('ABNotifySmsProvider', () => {
    const notifyParameters = {
      NOTIFY_URL: 'https://notify',
      NOTIFY_API_KEY: 'my-key',
      NOTIFY_TEMPLATE_ID: '123-fake-template',
    };
    const provider = createNotifySmsProvider(notifyParameters);

    it('can send sms', async () => {
      const notification = {
        to: '123 213 3432',
        message: { subject: 'testing 123', body: 'testing testing 1 2 3' },
      };
      await provider.send(notification);
      const mockClient = NotifyClient.mock.instances[0];
      expect(mockClient.sendSms).toHaveBeenCalledWith(
        notifyParameters.NOTIFY_TEMPLATE_ID,
        notification.to,
        expect.objectContaining({ personalisation: notification.message })
      );
    });
  });
});
