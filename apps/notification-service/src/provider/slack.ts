import { InstallProvider } from '@slack/oauth';
import { WebClient } from '@slack/web-api';
import { Notification, NotificationProvider } from '../notification';

class SlackNotificationProvider implements NotificationProvider {
  constructor(private installProvider: InstallProvider) {}

  async send({ to, message }: Notification): Promise<void> {
    const [teamId, channelId] = to?.split('/') || [];
    const { botToken } = await this.installProvider.authorize({
      isEnterpriseInstall: false,
      enterpriseId: null,
      teamId,
    });

    const client = new WebClient(botToken);

    const joinResponse = await client.conversations.join({ channel: channelId });
    if (!joinResponse.ok) {
      throw new Error(joinResponse.error);
    }

    const messageResponse = await client.chat.postMessage({
      channel: channelId,
      text: `${message.subject}\n\n${message.body}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${message.subject}*\n\n${message.body}`,
          },
        },
      ],
    });

    if (!messageResponse.ok) {
      throw new Error(messageResponse.error);
    }
  }
}

export const createSlackProvider = (installProvider: InstallProvider): NotificationProvider =>
  new SlackNotificationProvider(installProvider);
