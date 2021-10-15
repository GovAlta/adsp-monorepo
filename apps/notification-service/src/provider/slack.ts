import { InstallProvider } from '@slack/oauth';
import { WebClient } from '@slack/web-api';
import { Logger } from 'winston';
import { Notification, NotificationProvider } from '../notification';

class SlackNotificationProvider implements NotificationProvider {
  constructor(private logger: Logger, private installProvider: InstallProvider) {}

  async send({ tenantId, to, message }: Notification): Promise<void> {
    const [teamId, channelId] = to?.split('/') || [];
    const { botToken } = await this.installProvider.authorize({
      isEnterpriseInstall: false,
      enterpriseId: null,
      teamId,
    });

    const client = new WebClient(botToken);

    const joinResponse = await client.conversations.join({ channel: channelId });
    if (!joinResponse.ok) {
      this.logger.warn(`Join channel ${channelId} failed; may be able to send if bot invited into private channel`, {
        context: 'SlackNotificationProvider',
        tenant: tenantId?.toString(),
      });
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

export const createSlackProvider = (logger: Logger, installProvider: InstallProvider): NotificationProvider =>
  new SlackNotificationProvider(logger, installProvider);
