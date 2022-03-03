import { InstallProvider } from '@slack/oauth';
import { Application, RequestHandler } from 'express';
import { Logger } from 'winston';
import { Channel, Providers } from '../notification';
import { createEmailProvider } from './email';
import { createTeamsProviderRouter, createSlackProviderRouter } from './router';
import { createSlackProvider } from './slack';
import { createABNotifySmsProvider } from './sms';
import { createTeamsProvider, TeamsNotificationProvider } from './teams';
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
  provider: TeamsNotificationProvider,
  props: ProviderMiddlewareProps
): Application {
  const slackRouter = createSlackProviderRouter(props);
  app.use('/provider/v1/slack', slackRouter);

  const teamsRouter = createTeamsProviderRouter({ provider });
  app.use('/provider/v1/teams', teamsRouter);

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
  TEAMS_TENANT_ID: string;
  TEAMS_APP_ID: string;
  TEAMS_APP_SECRET: string;
  TEAMS_APP_TYPE: string;
}

export function initializeProviders(app: Application, props: ProviderProps & ProviderMiddlewareProps): Providers {
  const providers = {
    [Channel.email]: props.SMTP_HOST ? createEmailProvider(props) : null,
    [Channel.sms]: props.NOTIFY_API_KEY ? createABNotifySmsProvider(props) : null,
    [Channel.slack]: props.SLACK_CLIENT_ID ? createSlackProvider(props.logger, props.slackInstaller) : null,
    [Channel.teams]: props.TEAMS_APP_ID ? createTeamsProvider(props.logger, props.botRepository, props) : null,
  };

  applyProviderMiddleware(app, providers.teams, props);

  return providers;
}
