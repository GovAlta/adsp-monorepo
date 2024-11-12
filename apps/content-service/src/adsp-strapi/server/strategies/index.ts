import { User } from '@abgov/adsp-service-sdk';
import passport from 'koa-passport';
import type { Context } from 'koa';
import type { PlatformCapabilities } from '../constants';

interface Auth {
  authenticated?: boolean;
  credentials?: User;
  error?: unknown;
}

export default function getStrategies({ tenantStrategy, coreStrategy }: PlatformCapabilities) {
  const tenantStrategyName = 'adsp-tenant';
  passport.use(tenantStrategyName, tenantStrategy);

  const coreStrategyName = 'adsp-core';
  passport.use(coreStrategyName, coreStrategy);

  function verify(auth: Auth, _config: { scope: string[] }) {
    const { credentials: _user } = auth;
  }

  function authenticate(provider: string) {
    return async (ctx: Context) =>
      await new Promise<Auth>((resolve) =>
        passport.authenticate(provider, { session: false }, (error?: unknown, user?: User) =>
          error ? resolve({ error }) : resolve({ authenticated: !!user, credentials: user }),
        )(ctx),
      );
  }

  return {
    tenantStrategy: {
      name: tenantStrategyName,
      authenticate: authenticate(tenantStrategyName),
      verify,
    },
    coreStrategy: {
      name: coreStrategyName,
      authenticate: authenticate(coreStrategyName),
      verify,
    },
  };
}
