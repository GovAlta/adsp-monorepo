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
  ChannelAccount,
  ActivityTypes,
} from 'botbuilder';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { NotificationContent, NotificationProvider } from '../notification';
import { BotRepository, SlackChannelData } from './types';

class BotNotificationActivityHandler extends ActivityHandler {
  private LOG_CONTEXT = {
    context: 'BotNotificationActivityHandler',
  };

  constructor(private logger: Logger, private repository: BotRepository) {
    super();

    this.onMembersAdded(async (context, next) => {
      const botAdded = context.activity.membersAdded.find(({ id }) => id === context.activity.recipient.id);
      if (botAdded) {
        this.logger.info(`Bot added to conversation, resolving teams information...`, this.LOG_CONTEXT);
        this.logger.debug(
          `Channel data: ${JSON.stringify(context.activity.channelData || {}, null, 2)}`,
          this.LOG_CONTEXT
        );

        let tenantId: string;
        let conversationId: string;
        let botId: string;
        switch (context.activity.channelId) {
          case Channels.Msteams: {
            const { channel, tenant } = context.activity.channelData as TeamsChannelData;

            tenantId = tenant.id;
            conversationId = channel.id;
            botId = context.activity.recipient.id;
            break;
          }
          case Channels.Slack: {
            const {
              SlackMessage: {
                event: { team, channel },
              },
            } = context.activity.channelData as SlackChannelData;

            tenantId = team;
            conversationId = channel;
            botId = context.activity.recipient.id.split(':')[0];
            break;
          }
          default: {
            tenantId = context.activity.conversation?.tenantId;
            conversationId = context.activity.conversation?.id;
            botId = context.activity.recipient.id;
            break;
          }
        }
        const record = {
          channelId: context.activity.channelId as Channels,
          tenantId,
          conversationId,
          name: context.activity.conversation?.name,
          serviceUrl: context.activity.serviceUrl,
          botId,
          botName: context.activity.name,
        };

        await this.repository.save(record);
        this.logger.info(
          `Stored ${record.channelId} reference for ${record.name} (ID: ${record.tenantId}:${record.conversationId}) ` +
            `with bot ${record.botName} (ID: ${record.botId}) and service URL: ${context.activity.serviceUrl}.`,
          this.LOG_CONTEXT
        );
      }

      await next();
    });

    this.onMembersRemoved(async (context, next) => {
      const botRemoved = context.activity.membersRemoved.find(({ id }) => id === context.activity.recipient.id);
      if (botRemoved) {
        this.logger.info(`Bot removed from conversation, resolving teams information...`, this.LOG_CONTEXT);

        const { channel, tenant } = context.activity.channelData as TeamsChannelData;
        const recordId = {
          channelId: context.activity.channelId as Channels,
          tenantId: tenant?.id || context.activity.conversation?.tenantId,
          conversationId: channel?.id || context.activity.conversation?.id,
        };
        const deleted = await this.repository.delete(recordId);

        if (deleted) {
          this.logger.info(
            `Deleted ${recordId.channelId}  reference for ${channel?.name || context.activity.conversation?.name} ` +
              `(ID: ${recordId.tenantId}:${recordId.conversationId}).`,
            this.LOG_CONTEXT
          );
        }
      }

      await next();
    });

    this.onMessage(async (context, next) => {
      const reference = TurnContext.getConversationReference(context.activity);
      this.logger.debug(`Conversation reference: ${JSON.stringify(reference, null, 2)}`, this.LOG_CONTEXT);

      await context.sendActivity({ text: '*bee boop*', textFormat: 'markdown' });
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

    // Catch-all for errors.
    this.adapter.onTurnError = async (context, error) => {
      // This check writes out errors to console log .vs. app insights.
      // NOTE: In production environment, you should consider logging this to Azure
      //       application insights.
      this.logger.error(`[onTurnError] unhandled error: ${error}`, this.LOG_CONTEXT);

      // Send a trace activity, which will be displayed in Bot Framework Emulator
      await context.sendTraceActivity(
        'OnTurnError Trace',
        `${error}`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
      );
    };
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
      conversationReference = await new Promise((resolve) =>
        this.adapter.createConversationAsync(
          this.appId,
          Channels.Msteams,
          conversation.serviceUrl,
          null,
          {
            isGroup: true,
            channelData: {
              channel: {
                id: conversationId,
              },
            },
          } as ConversationParameters,
          async (context) => {
            const conversationReference = TurnContext.getConversationReference(context.activity);
            resolve(conversationReference);
          }
        )
      );
    } else if (channelId === Channels.Slack) {
      conversationReference = {
        bot: {
          id: `${conversation.botId}:${conversation.tenantId}`,
          name: conversation.botName,
        },
        user: {} as ChannelAccount,
        channelId,
        serviceUrl: conversation.serviceUrl,
        conversation: {
          id: `${conversation.botId}:${conversation.tenantId}:${conversation.channelId}`,
          conversationType: null,
          name: conversation.name,
          isGroup: true,
        },
      };
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
          name: null,
          isGroup: true,
        },
      };
    }

    await this.adapter.continueConversationAsync(this.appId, conversationReference, async (turnContext) => {
      await turnContext.sendActivity({
        type: ActivityTypes.Message,
        text: `${message.subject}\n\n${message.body}`,
        textFormat: 'markdown',
      });
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
