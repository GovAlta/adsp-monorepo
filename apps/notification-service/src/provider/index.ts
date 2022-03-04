import { InstallProvider } from '@slack/oauth';
import { Application, RequestHandler } from 'express';
import { Logger } from 'winston';
import { Channel, Providers } from '../notification';
import { createEmailProvider } from './email';
import { createBotProviderRouter, createSlackProviderRouter } from './router';
import { createSlackProvider } from './slack';
import { createABNotifySmsProvider } from './sms';
import { createBotProvider, BotNotificationProvider } from './bot';
import { BotRepository, SlackRepository } from './types';

export * from './types';

interface ProviderMiddlewareProps {
  slackInstaller: InstallProvider;
  slackRepository: SlackRepository;
  botRepository: BotRepository;
  getRootUrl: RequestHandler;
}

function applyProviderMiddleware(
  app: Application,
  provider: BotNotificationProvider,
  props: ProviderMiddlewareProps
): Application {
  const slackRouter = createSlackProviderRouter(props);
  app.use('/provider/v1/slack', slackRouter);

  const botRouter = createBotProviderRouter({ provider });
  app.use('/provider/v1/bot', botRouter);

  return app;
}

interface ProviderProps {
  logger: Logger;
  slackInstaller: InstallProvider;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  SLACK_CLIENT_ID: string;
  SLACK_CLIENT_SECRET: string;
  SLACK_STATE_SECRET: string;
  NOTIFY_URL: string;
  NOTIFY_API_KEY: string;
  NOTIFY_TEMPLATE_ID: string;
  BOT_TENANT_ID: string;
  BOT_APP_ID: string;
  BOT_APP_SECRET: string;
  BOT_APP_TYPE: string;
}

export function initializeProviders(app: Application, props: ProviderProps & ProviderMiddlewareProps): Providers {
  const providers = {
    [Channel.email]: props.SMTP_HOST ? createEmailProvider(props) : null,
    [Channel.sms]: props.NOTIFY_API_KEY ? createABNotifySmsProvider(props) : null,
    [Channel.slack]: props.SLACK_CLIENT_ID ? createSlackProvider(props.logger, props.slackInstaller) : null,
    [Channel.teams]: props.BOT_APP_ID ? createBotProvider(props.logger, props.botRepository, props) : null,
  };

  applyProviderMiddleware(app, providers.teams, props);

  return providers;
}
