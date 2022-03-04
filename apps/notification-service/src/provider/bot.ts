import { InvalidOperationError } from '@core-services/core-common';
import {
  Channels,
  CloudAdapter,
  ConversationReference,
  ConfigurationServiceClientCredentialFactory,
  createBotFrameworkAuthenticationFromConfiguration,
  ActivityHandler,
  TurnContext,
} from 'botbuilder';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { NotificationContent, NotificationProvider } from '../notification';
import { BotRepository } from './types';

class BotNotificationActivityHandler extends ActivityHandler {
  constructor(private logger: Logger, private repository: BotRepository) {
    super();

    this.onConversationUpdate(async (context, next) => {
      const reference = TurnContext.getConversationReference(context.activity);
      await this.repository.save({
        channelId: reference.channelId as Channels,
        tenantId: reference.conversation.tenantId,
        conversationId: reference.conversation.id,
        name: reference.conversation.name,
        serviceUrl: reference.serviceUrl,
      });
      this.logger.info(
        `Stored conversation reference for ${reference.conversation.name} on channel ${reference.channelId} (ID: ${reference.conversation.id}).`
      );

      await next();
    });

    this.onMessage(async (context, next) => {
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
  private appId: string;
  private handler: BotNotificationActivityHandler;
  private adapter: CloudAdapter;

  constructor(
    private logger: Logger,
    private repository: BotRepository,
    { BOT_TENANT_ID: BOT_APP_TENANT_ID, BOT_APP_TYPE, BOT_APP_ID, BOT_APP_SECRET }: ProviderProps
  ) {
    this.appId = BOT_APP_ID;
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
      this.logger.error(`[onTurnError] unhandled error: ${error}`);

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
    const [channelId, tenantId, conversationId] = to?.split('/') || [];

    const conversation = await this.repository.get({
      channelId: channelId as Channels,
      tenantId,
      conversationId,
    });

    if (!conversation) {
      throw new InvalidOperationError(`No conversation reference found for address: ${to}`);
    }

    const conversationReference: Partial<ConversationReference> = {
      channelId: conversation.channelId,
      conversation: { tenantId: conversation.tenantId, id: to, isGroup: false, name: null, conversationType: null },
      serviceUrl: conversation.serviceUrl,
    };

    this.adapter.continueConversationAsync(this.appId, conversationReference, async (turnContext) => {
      await turnContext.sendActivity({ text: `*${message.subject}*\n\n${message.body}`, textFormat: 'markdown' });
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
