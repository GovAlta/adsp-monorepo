import { Application } from 'express';
import { Logger } from 'winston';
import { Channel, Providers } from '../notification';
import { createEmailProvider } from './email';
import { createBotProviderRouter } from './router';
import { createNotifySmsProvider } from './sms';
import { createBotProvider, BotNotificationProvider } from './bot';
import { BotRepository } from './types';

export * from './types';

function applyProviderMiddleware(app: Application, provider: BotNotificationProvider): Application {
  const botRouter = createBotProviderRouter({ provider });
  app.use('/provider/v1/bot', botRouter);

  return app;
}

interface ProviderProps {
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  NOTIFY_URL: string;
  NOTIFY_API_KEY: string;
  NOTIFY_TEMPLATE_ID: string;
  BOT_TENANT_ID: string;
  BOT_APP_ID: string;
  BOT_APP_SECRET: string;
  BOT_APP_TYPE: string;
}

export function initializeProviders(
  logger: Logger,
  app: Application,
  botRepository: BotRepository,
  props: ProviderProps
): Providers {
  const providers = {
    [Channel.email]: props.SMTP_HOST ? createEmailProvider(props) : null,
    [Channel.sms]: props.NOTIFY_API_KEY ? createNotifySmsProvider(props) : null,
    [Channel.bot]: props.BOT_APP_ID ? createBotProvider(logger, botRepository, props) : null,
  };

  applyProviderMiddleware(app, providers.bot);

  return providers;
}
