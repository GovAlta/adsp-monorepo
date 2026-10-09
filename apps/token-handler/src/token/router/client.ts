import { EventService, TenantService, UnauthorizedUserError, isAllowedUser } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError, createValidationHandler } from '@core-services/core-common';
import * as cors from 'cors';
import { json, NextFunction, Request, Response, Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { RequestHandler } from 'express-serve-static-core';
import { body, param, query } from 'express-validator';
import { PassportStatic } from 'passport';
import { Logger } from 'winston';

import { TokenHandlerConfiguration } from '../configuration';
import { clientRegistered } from '../events';
import { AuthenticationClient } from '../model';
import { ServiceRoles } from '../roles';
import { createTenantHandler, keepTenantInSession } from '../tenant';
import { UserSessionData } from '../types';

const CLIENT = 'tk_client';
// Redirect URIs are registered as valid redirect URIs in Keycloak, so register and update share one definition.
// Hosts without a top level domain (e.g. localhost) are allowed for local development.
const REDIRECT_URI_OPTIONS = { require_tld: false, require_protocol: true, protocols: ['http', 'https'] };

export function getAuthenticationClient() {
  return async function (req: Request, _res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const config = await req.getConfiguration<TokenHandlerConfiguration, TokenHandlerConfiguration>();
      const client = config.getClient(id);
      if (!client) {
        throw new NotFoundError('client', id);
      }

      req[CLIENT] = client;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function registerClient(eventService: EventService): RequestHandler {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { registrationToken, authCallbackUrl } = req.body;
      const user = req.user;
      const tenant = req.tenant;

      if (!isAllowedUser(user, tenant.id, ServiceRoles.Admin)) {
        throw new UnauthorizedUserError('register client', user);
      }

      const client = req[CLIENT] as AuthenticationClient;
      const result = await client.register(tenant, registrationToken, authCallbackUrl);

      res.send({ registered: !!result.clientId });

      eventService.send(clientRegistered(client, user));
    } catch (err) {
      next(err);
    }
  };
}

export function updateClient(eventService: EventService): RequestHandler {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { redirectUris } = req.body;
      const user = req.user;
      const tenant = req.tenant;

      if (!isAllowedUser(user, tenant.id, ServiceRoles.Admin)) {
        throw new UnauthorizedUserError('update client', user);
      }

      const client = req[CLIENT] as AuthenticationClient;
      await client.updateRegistration(redirectUris);

      res.send({ updated: true });

      eventService.send(clientRegistered(client, user));
    } catch (err) {
      next(err);
    }
  };
}

export function getClient(): RequestHandler {
  return async function (req, res, next) {
    try {
      const user = req.user;

      if (!isAllowedUser(user, req.tenant?.id, ServiceRoles.Admin)) {
        throw new UnauthorizedUserError('get client', user);
      }

      const client = req[CLIENT] as AuthenticationClient;
      const { id, authCallbackUrl, successRedirectUrl, failureRedirectUrl } = client;
      // Credentials are lazy loaded, so they must be requested to know if the client is registered.
      const credentials = await client.getCredentials();
      res.send({
        id,
        authCallbackUrl,
        successRedirectUrl,
        failureRedirectUrl,
        clientId: credentials?.clientId,
      });
    } catch (err) {
      next(err);
    }
  };
}

export function startAuthenticate(passport: PassportStatic) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const client: AuthenticationClient = req[CLIENT];

      const handler = await client.authenticate(passport);
      handler(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}

export function completeAuthenticate(passport: PassportStatic) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const client: AuthenticationClient = req[CLIENT];

      const handler = await client.authenticate(passport, true);
      handler(req, res, () => {
        res.redirect(req.isAuthenticated() ? client.successRedirectUrl : client.failureRedirectUrl);
      });
    } catch (err) {
      next(err);
    }
  };
}

// Gets the URL to end the session in access service, if the client is configured to; failures do not prevent logout.
async function getAccessServiceLogoutUrl(req: Request, user: UserSessionData, logger?: Logger): Promise<string | null> {
  const context = { context: 'ClientRouter', tenant: user.tenantId?.toString() };

  try {
    const config = await req.getConfiguration<TokenHandlerConfiguration, TokenHandlerConfiguration>();
    const client = config?.getClient(user.authenticatedBy);
    if (!client?.keycloakLogout) {
      return null;
    }

    // Ending the session in access service ends it for all of the applications that share it, so it is not done
    // for requests that another site caused the browser to make (e.g. a link or redirect from another site).
    if (req.get('sec-fetch-site') === 'cross-site') {
      logger?.warn(`Not ending access service session for cross-site logout request of user (ID: ${user.id}).`, context);
      return null;
    }

    const postLogoutRedirectUri = req.session?.['postLogoutRedirectUri'] as string;
    const logoutUrl = postLogoutRedirectUri ? await client.getLogoutUrl(user.idToken, postLogoutRedirectUri) : null;
    if (logoutUrl) {
      logger?.info(`Redirecting user (ID: ${user.id}) to end the access service session.`, context);
    } else {
      logger?.warn(
        `Access service logout is on for client '${client.id}', but is not available for the session of user ` +
          `(ID: ${user.id}); ending token handler session only.`,
        context
      );
    }

    return logoutUrl;
  } catch (err) {
    logger?.warn(`Unable to determine access service logout for user (ID: ${user.id}): ${err}`, context);
    return null;
  }
}

export function logout(logger?: Logger): RequestHandler {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = req.user as UserSessionData;
      if (!user) {
        throw new InvalidOperationError('No user to logout.');
      }

      if (id != user.authenticatedBy) {
        throw new InvalidOperationError('User not authenticate by specified client.');
      }

      // This needs the user, which is not available after logout.
      const logoutUrl = await getAccessServiceLogoutUrl(req, user, logger);
      req.logout((err) => (err ? next(err) : res.redirect(logoutUrl || '/')));
    } catch (err) {
      next(err);
    }
  };
}

interface RouterOptions {
  configurationHandler: RequestHandler;
  eventService: EventService;
  logger?: Logger;
  passport: PassportStatic;
  tenantHandler: RequestHandler;
  tenantService: TenantService;
}

export function createClientRouter({
  configurationHandler,
  eventService,
  logger,
  passport,
  tenantHandler,
  tenantService,
}: RouterOptions) {
  const router = Router();

  router.options('/clients/:id', cors());

  router.post(
    '/clients/:id',
    cors(),
    json({ limit: '1mb' }),
    createValidationHandler(
      param('id').isString().isLength({ min: 1, max: 50 }),
      body('registrationToken').isString().isLength({ min: 1, max: 8192 }),
      body('authCallbackUrl').optional().isURL(REDIRECT_URI_OPTIONS).isLength({ min: 1, max: 2048 })
    ),
    passport.authenticate('tenant', { session: false }),
    tenantHandler,
    configurationHandler,
    getAuthenticationClient(),
    registerClient(eventService)
  );

  router.put(
    '/clients/:id',
    cors(),
    json({ limit: '1mb' }),
    createValidationHandler(
      param('id').isString().isLength({ min: 1, max: 50 }),
      body('redirectUris').isArray({ min: 1 }),
      body('redirectUris.*').isURL(REDIRECT_URI_OPTIONS).isLength({ min: 1, max: 2048 })
    ),
    passport.authenticate('tenant', { session: false }),
    tenantHandler,
    configurationHandler,
    getAuthenticationClient(),
    updateClient(eventService)
  );

  router.get(
    '/clients/:id',
    cors(),
    json({ limit: '1mb' }),
    createValidationHandler(param('id').isString().isLength({ min: 1, max: 50 })),
    passport.authenticate('tenant', { session: false }),
    tenantHandler,
    configurationHandler,
    getAuthenticationClient(),
    getClient()
  );

  // Rate limit to 100 requests per 5 minute window (20 per minute).
  const rateLimitHandler = rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });
  // The tenant is provided when signing in, and is kept in the session to complete it.
  const initiateTenantHandler = createTenantHandler(tenantService, 'initiate');
  const completeTenantHandler = createTenantHandler(tenantService, 'complete');

  router.get(
    '/clients/:id/auth',
    createValidationHandler(
      param('id').isString().isLength({ min: 1, max: 50 }),
      query('callbackUrl').optional().isString().isURL(REDIRECT_URI_OPTIONS).isLength({ max: 2048 }),
      query('tenant').optional({ checkFalsy: true }).isString().isLength({ min: 1, max: 100 })
    ),
    rateLimitHandler,
    initiateTenantHandler,
    configurationHandler,
    getAuthenticationClient(),
    // The tenant is only kept for clients that exist.
    keepTenantInSession,
    startAuthenticate(passport)
  );

  router.get(
    '/clients/:id/callback',
    createValidationHandler(param('id').isString().isLength({ min: 1, max: 50 })),
    rateLimitHandler,
    completeTenantHandler,
    configurationHandler,
    getAuthenticationClient(),
    completeAuthenticate(passport)
  );

  router.get(
    '/clients/:id/logout',
    createValidationHandler(param('id').isString().isLength({ min: 1, max: 50 })),
    rateLimitHandler,
    configurationHandler,
    logout(logger)
  );

  return router;
}
