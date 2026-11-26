import type { AdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import type { Application, RequestHandler } from 'express';
import * as passport from 'passport';
import { createRotationRouter, RotationRouterProps } from './router';
import { createSubscriptionSync } from './subscriptions';
import { createRealmSettingsStore } from './settings';

export * from './constants';
export * from './keycloak';
export * from './roles';
export * from './router';
export * from './settings';

interface RotationMiddlewareProps extends Omit<RotationRouterProps, 'settingsStore' | 'skipClientIds'> {
  serviceId: AdspId;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  tenantHandler: RequestHandler;
}

export function applyRotationMiddleware(
  app: Application,
  { serviceId, directory, tokenProvider, tenantHandler, ...props }: RotationMiddlewareProps,
): Application {
  app.use(
    '/api/rotation/v1',
    passport.authenticate(['jwt', 'jwt-tenant'], { session: false }),
    tenantHandler,
    createRotationRouter({
      ...props,
      settingsStore: createRealmSettingsStore(directory, tokenProvider, serviceId),
      subscriptions: createSubscriptionSync(props.logger, directory),
      skipClientIds: [],
    }),
  );
  return app;
}
