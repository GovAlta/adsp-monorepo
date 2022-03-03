import { InvalidOperationError } from '@core-services/core-common';
import {
  ConversationReference,
  ConfigurationServiceClientCredentialFactory,
  CloudAdapter,
  createBotFrameworkAuthenticationFromConfiguration,
  TeamsActivityHandler,
  TurnContext,
  Channels,
} from 'botbuilder';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { BotRepository } from '.';
import { NotificationContent, NotificationProvider } from '../notification';

class TeamsNotificationActivityHandler extends TeamsActivityHandler {
  constructor(private logger: Logger, private repository: BotRepository) {
    super();

    this.onConversationUpdate(async (context, next) => {
      const reference = TurnContext.getConversationReference(context.activity);
      await this.repository.save({
        channelId: reference.channelId as Channels,
        tenantId: reference.conversation.tenantId,
        conversationId: reference.conversation.id,
        serviceUrl: reference.serviceUrl,
      });
      this.logger.info(
        `Stored conversation reference for ${reference.conversation.name} on channel ${reference.channelId} (ID: ${reference.conversation.tenantId}:${reference.conversation.id}).`
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
  TEAMS_TENANT_ID: string;
  TEAMS_APP_ID: string;
  TEAMS_APP_SECRET: string;
  TEAMS_APP_TYPE: string;
}

export class TeamsNotificationProvider implements NotificationProvider {
  private teamsTenantId: string;
  private appId: string;
  private handler: TeamsNotificationActivityHandler;
  private adapter: CloudAdapter;

  constructor(
    private logger: Logger,
    private repository: BotRepository,
    { TEAMS_TENANT_ID: TEAMS_APP_TENANT_ID, TEAMS_APP_TYPE, TEAMS_APP_ID, TEAMS_APP_SECRET }: ProviderProps
  ) {
    this.teamsTenantId = TEAMS_APP_TENANT_ID;
    this.appId = TEAMS_APP_ID;
    this.handler = new TeamsNotificationActivityHandler(logger, this.repository);

    const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
      MicrosoftAppId: TEAMS_APP_ID,
      MicrosoftAppPassword: TEAMS_APP_SECRET,
      MicrosoftAppType: TEAMS_APP_TYPE,
      MicrosoftAppTenantId: TEAMS_APP_TENANT_ID,
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
    const conversation = await this.repository.get({
      channelId: Channels.Msteams,
      tenantId: this.teamsTenantId,
      conversationId: to,
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

export function createTeamsProvider(
  logger: Logger,
  repository: BotRepository,
  props: ProviderProps
): TeamsNotificationProvider {
  return new TeamsNotificationProvider(logger, repository, props);
}
