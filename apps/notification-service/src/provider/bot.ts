import { InvalidOperationError } from '@core-services/core-common';
import {
  Channels,
  CloudAdapter,
  ConfigurationServiceClientCredentialFactory,
  createBotFrameworkAuthenticationFromConfiguration,
  ActivityHandler,
  TeamsChannelData,
  TurnContext,
  ConversationParameters,
  ConversationReference,
  Activity,
} from 'botbuilder';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { NotificationContent, NotificationProvider } from '../notification';
import { BotRepository, SlackChannelData } from './types';

class BotNotificationActivityHandler extends ActivityHandler {
  private LOG_CONTEXT = {
    context: 'BotNotificationActivityHandler',
  };

  private async storeConversationRecord(activity: Activity): Promise<void> {
    this.logger.debug(`Channel data: ${JSON.stringify(activity.channelData || {}, null, 2)}`, this.LOG_CONTEXT);

    let tenantId: string;
    let conversationId: string;
    let botId: string;
    switch (activity.channelId) {
      case Channels.Msteams: {
        const { tenant, team } = activity.channelData as TeamsChannelData;

        tenantId = tenant.id;
        conversationId = activity.conversation?.id.split(';')[0] || team.id;
        botId = activity.recipient.id;
        break;
      }
      case Channels.Slack: {
        const {
          SlackMessage: {
            event: { team, channel },
          },
        } = activity.channelData as SlackChannelData;

        tenantId = team;
        conversationId = channel;
        botId = activity.recipient.id.split(':')[0];
        break;
      }
      default: {
        tenantId = activity.conversation?.tenantId;
        conversationId = activity.conversation?.id;
        botId = activity.recipient.id;
        break;
      }
    }
    const record = {
      channelId: activity.channelId as Channels,
      tenantId,
      conversationId,
      name: activity.conversation?.name,
      serviceUrl: activity.serviceUrl,
      botId,
      botName: activity.name,
    };

    this.logger.debug(`Storing conversation reference: ${JSON.stringify(record, null, 2)}`, this.LOG_CONTEXT);
    await this.repository.save(record);
    this.logger.info(
      `Stored ${record.channelId} reference for ${record.name} (ID: ${record.tenantId}:${record.conversationId}) ` +
        `with bot ${record.botName} (ID: ${record.botId}) and service URL: ${activity.serviceUrl}.`,
      this.LOG_CONTEXT
    );
  }

  constructor(private logger: Logger, private repository: BotRepository) {
    super();

    this.onMembersAdded(async (context, next) => {
      const botAdded = context.activity.membersAdded.find(({ id }) => id === context.activity.recipient.id);
      this.logger.debug(
        `Received member added activity for members: ${context.activity.membersAdded
          .map(({ id, name }) => `${name} (ID ${id})`)
          .join(', ')}`,
        this.LOG_CONTEXT
      );

      if (botAdded) {
        this.logger.info(
          `Bot added to conversation, resolving ${context.activity.channelId} information...`,
          this.LOG_CONTEXT
        );

        await this.storeConversationRecord(context.activity);
      }

      await next();
    });

    this.onMembersRemoved(async (context, next) => {
      const botRemoved = context.activity.membersRemoved.find(({ id }) => id === context.activity.recipient.id);
      this.logger.debug(
        `Received member removed activity for members: ${context.activity.membersRemoved
          .map(({ id, name }) => `${name} (ID ${id})`)
          .join(', ')}`,
        this.LOG_CONTEXT
      );

      if (botRemoved) {
        this.logger.info(`Bot removed from conversation, resolving teams information...`, this.LOG_CONTEXT);

        const recordId = {
          channelId: context.activity.channelId as Channels,
          tenantId: context.activity.conversation?.tenantId,
          conversationId: context.activity.conversation?.id,
        };

        const deleted = await this.repository.delete(recordId);
        if (deleted) {
          this.logger.info(
            `Deleted ${recordId.channelId} reference for ${
              context.activity.conversation?.name || context.activity.conversation?.name
            } ` + `(ID: ${recordId.tenantId}:${recordId.conversationId}).`,
            this.LOG_CONTEXT
          );
        }
      }

      await next();
    });

    this.onMessage(async (context, next) => {
      await this.storeConversationRecord(context.activity);
      const reference = TurnContext.getConversationReference(context.activity);
      this.logger.debug(`Conversation reference: ${JSON.stringify(reference || {}, null, 2)}`, this.LOG_CONTEXT);

      let address: string;
      if (reference.channelId === Channels.Slack) {
        address = reference.conversation?.id.split(':').slice(1).join('/');
      } else if (reference.channelId === Channels.Msteams) {
        address = reference.conversation?.id.split(';')[0];
      } else {
        address = reference.conversation?.id;
      }

      const reply: Partial<Activity> = {
        text: `*Bee boop...* Ready to send notifications to this channel at address: **${reference.channelId}/${address}**`,
        textFormat: 'markdown',
      };

      await context.sendActivity(reply);
      await next();
    });
  }
}

interface ProviderProps {
  BOT_TENANT_ID: string;
  BOT_APP_ID: string;
  BOT_APP_SECRET: string;
  BOT_APP_TYPE: string;
}

export class BotNotificationProvider implements NotificationProvider {
  private LOG_CONTEXT = {
    context: 'BotNotificationProvider',
  };
  private appId: string;
  private appTenantId: string;
  private handler: BotNotificationActivityHandler;
  private adapter: CloudAdapter;

  constructor(
    private logger: Logger,
    private repository: BotRepository,
    { BOT_TENANT_ID: BOT_APP_TENANT_ID, BOT_APP_TYPE, BOT_APP_ID, BOT_APP_SECRET }: ProviderProps
  ) {
    this.appId = BOT_APP_ID;
    this.appTenantId = BOT_APP_TENANT_ID;
    this.handler = new BotNotificationActivityHandler(logger, this.repository);

    const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
      MicrosoftAppId: BOT_APP_ID,
      MicrosoftAppPassword: BOT_APP_SECRET,
      MicrosoftAppType: BOT_APP_TYPE,
      MicrosoftAppTenantId: BOT_APP_TENANT_ID,
    });

    const botFrameworkAuthentication = createBotFrameworkAuthenticationFromConfiguration(null, credentialsFactory);
    this.adapter = new CloudAdapter(botFrameworkAuthentication);
  }

  async processMessage(req: Request, res: Response): Promise<void> {
    await this.adapter.process(req, res, (context) => this.handler.run(context));
  }

  async send({ to, message }: NotificationContent): Promise<void> {
    const ids = to?.split('/') || [];
    const channelId = ids[0] as Channels;
    const tenantId = ids.length > 2 ? ids[1] : this.appTenantId;
    const conversationId = ids.length > 2 ? ids[2] : ids[1];

    const conversation = await this.repository.get({
      channelId,
      tenantId,
      conversationId,
    });

    if (!conversation) {
      throw new InvalidOperationError(`No conversation reference found for address: ${to}`);
    }

    let conversationReference: Partial<ConversationReference>;
    if (channelId === Channels.Msteams) {
      await this.adapter.createConversationAsync(
        this.appId,
        Channels.Msteams,
        conversation.serviceUrl,
        null,
        {
          bot: {
            id: conversation.botId,
          },
          tenantId: conversation.tenantId,
          isGroup: true,
          channelData: {
            tenant: {
              id: conversation.tenantId,
            },
            channel: {
              id: conversationId,
            },
          } as TeamsChannelData,
        } as ConversationParameters,
        async (context) => {
          conversationReference = TurnContext.getConversationReference(context.activity);
        }
      );
    } else if (channelId === Channels.Slack) {
      conversationReference = {
        bot: {
          id: `${conversation.botId}:${conversation.tenantId}`,
          name: conversation.botName,
        },
        channelId,
        serviceUrl: conversation.serviceUrl,
        conversation: {
          id: `${conversation.botId}:${tenantId}:${conversationId}`,
          name: conversation.name,
          isGroup: true,
        },
      } as ConversationReference;
    } else {
      conversationReference = {
        bot: {
          id: conversation.botId,
          name: conversation.botName,
        },
        channelId,
        serviceUrl: conversation.serviceUrl,
        conversation: {
          id: conversationId,
          conversationType: null,
          name: conversation.name,
          isGroup: true,
        },
      };
    }

    await this.adapter.continueConversationAsync(this.appId, conversationReference, async (turnContext) => {
      this.logger.debug(
        `Sending activity to channel ${channelId}: ${
          conversationReference.conversation.id
        } with conversation reference: ${JSON.stringify(conversationReference, null, 2)}`,
        this.LOG_CONTEXT
      );
      try {
        await turnContext.sendActivity({ text: `${message.subject}\n\n${message.body}`, textFormat: 'markdown' });
      } catch (err) {
        this.logger.error(
          `Failed sending activity to channel ${channelId}: ${conversationReference.conversation.id}. ${JSON.stringify(
            err
          )}`,
          this.LOG_CONTEXT
        );

        throw err;
      }
    });
  }
}

export function createBotProvider(
  logger: Logger,
  repository: BotRepository,
  props: ProviderProps
): BotNotificationProvider {
  return new BotNotificationProvider(logger, repository, props);
}
