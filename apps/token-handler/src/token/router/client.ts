import { EventService, TenantService, UnauthorizedUserError, isAllowedUser } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError, createValidationHandler } from '@core-services/core-common';
import * as cors from 'cors';
import { json, NextFunction, Request, Response, Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { RequestHandler } from 'express-serve-static-core';
import { body, param } from 'express-validator';
import { PassportStatic } from 'passport';

import { TokenHandlerConfiguration } from '../configuration';
import { clientRegistered } from '../events';
import { AuthenticationClient } from '../model';
import { ServiceRoles } from '../roles';
import { createTenantHandler } from '../tenant';
import { UserSessionData } from '../types';

const CLIENT = 'tk_client';
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
      const { registrationToken } = req.body;
      const user = req.user;
      const tenant = req.tenant;

      if (!isAllowedUser(user, tenant.id, ServiceRoles.Admin)) {
        throw new UnauthorizedUserError('register client', user);
      }

      const client = req[CLIENT] as AuthenticationClient;
      const result = await client.register(tenant, registrationToken);

      res.send({ registered: !!result.clientId });

      eventService.send(clientRegistered(client, user));
    } catch (err) {
      next(err);
    }
  };
}

export function getClient(): RequestHandler {
  return function (req, res, next) {
    try {
      const user = req.user;

      if (!isAllowedUser(user, req.tenant?.id, ServiceRoles.Admin)) {
        throw new UnauthorizedUserError('get client', user);
      }

      const { id, authCallbackUrl, successRedirectUrl, failureRedirectUrl, credentials, ..._ } = req[
        CLIENT
      ] as AuthenticationClient;
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

export function logout(): RequestHandler {
  return function (req, res, next) {
    try {
      const { id } = req.params;
      const user = req.user as UserSessionData;
      if (!user) {
        throw new InvalidOperationError('No user to logout.');
      }

      if (id != user.authenticatedBy) {
        throw new InvalidOperationError('User not authenticate by specified client.');
      }

      req.logout((err) => (err ? next(err) : res.redirect('/')));
    } catch (err) {
      next(err);
    }
  };
}

interface RouterOptions {
  configurationHandler: RequestHandler;
  eventService: EventService;
  passport: PassportStatic;
  tenantHandler: RequestHandler;
  tenantService: TenantService;
}

export function createClientRouter({
  configurationHandler,
  eventService,
  passport,
  tenantHandler,
  tenantService,
}: RouterOptions) {
  const router = Router();

  router.options('/clients/:id', cors());

  router.post(
    '/clients/:id',
    json({ limit: '1mb' }),
    createValidationHandler(
      param('id').isString().isLength({ min: 1, max: 50 }),
      body('registrationToken').isString().isLength({ min: 1, max: 8192 })
    ),
    passport.authenticate('tenant', { session: false }),
    tenantHandler,
    configurationHandler,
    getAuthenticationClient(),
    registerClient(eventService)
  );

  router.get(
    '/clients/:id',
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
  const proxyTenantHandler = createTenantHandler(tenantService);

  router.get(
    '/clients/:id/auth',
    createValidationHandler(param('id').isString().isLength({ min: 1, max: 50 })),
    rateLimitHandler,
    proxyTenantHandler,
    configurationHandler,
    getAuthenticationClient(),
    startAuthenticate(passport)
  );

  router.get(
    '/clients/:id/callback',
    createValidationHandler(param('id').isString().isLength({ min: 1, max: 50 })),
    rateLimitHandler,
    proxyTenantHandler,
    configurationHandler,
    getAuthenticationClient(),
    completeAuthenticate(passport)
  );

  router.get(
    '/clients/:id/logout',
    createValidationHandler(param('id').isString().isLength({ min: 1, max: 50 })),
    logout()
  );

  return router;
}
