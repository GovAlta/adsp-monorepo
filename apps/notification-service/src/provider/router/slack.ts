import { UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler } from '@core-services/core-common';
import { InstallProvider } from '@slack/oauth';
import { WebClient } from '@slack/web-api';
import { RequestHandler, Router } from 'express';
import * as passport from 'passport';
import { ServiceUserRoles } from '../../notification';
import { SlackRepository } from './../types';

interface RouterProps {
  slackInstaller: InstallProvider;
  slackRepository: SlackRepository;
  getRootUrl: RequestHandler;
}

export const createSlackProviderRouter = ({ slackInstaller, slackRepository, getRootUrl }: RouterProps): Router => {
  const router = Router();

  router.get(
    '/install',
    passport.authenticate(['core', 'tenant'], { session: false }),
    assertAuthenticatedHandler,
    getRootUrl,
    async (req, res, next) => {
      try {
        const user = req.user;
        if (!user.roles?.includes(ServiceUserRoles.SubscriptionAdmin)) {
          throw new UnauthorizedUserError('install Slack app', user);
        }

        const { from } = req.query;
        const slackInstall = await slackInstaller.generateInstallUrl({
          scopes: ['team:read', 'chat:write'],
          metadata: from as string,
          redirectUri: new URL('/provider/v1/slack/oauth_redirect', req['rootUrl']).href,
        });

        res.send(slackInstall);
      } catch (err) {
        next(err);
      }
    }
  );

  router.get('/oauth_redirect', async (req, res) => {
    await slackInstaller.handleCallback(req, res, {
      success: (_installation, options) => {
        let redirectUrl: URL;
        if (options.metadata) {
          try {
            redirectUrl = new URL(options.metadata);
          } catch (err) {
            // not a url?
          }
        }

        if (redirectUrl) {
          res.redirect(redirectUrl.href);
        } else {
          res.sendStatus(200);
        }
      },
    });
  });

  router.get(
    '/teams',
    passport.authenticate(['core', 'tenant'], { session: false }),
    assertAuthenticatedHandler,
    async (req, res, next) => {
      try {
        const user = req.user;
        if (!user.roles?.includes(ServiceUserRoles.SubscriptionAdmin)) {
          throw new UnauthorizedUserError('get installed Slack teams', user);
        }

        const teams = await slackRepository.getInstalledTeams();
        res.send(teams);
      } catch (err) {
        next(err);
      }
    }
  );

  router.get(
    '/teams/:teamId',
    passport.authenticate(['core', 'tenant'], { session: false }),
    assertAuthenticatedHandler,
    async (req, res, next) => {
      try {
        const user = req.user;
        const { teamId } = req.params;

        if (!user.roles?.includes(ServiceUserRoles.SubscriptionAdmin)) {
          throw new UnauthorizedUserError('get Slack team info', user);
        }

        const { botToken } = await slackInstaller.authorize({
          isEnterpriseInstall: false,
          enterpriseId: null,
          teamId,
        });

        const client = new WebClient(botToken);
        const teamInfo = await client.team.info({ team: teamId });

        res.send(teamInfo);
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
};
