import { AdspId } from '@abgov/adsp-service-sdk';
import * as createRedisSession from 'connect-redis';
import * as cookieParser from 'cookie-parser';
import { Application } from 'express';
import * as session from 'express-session';
import { PassportStatic, Strategy } from 'passport';
import { RedisClient } from 'redis';

import { UserSessionData } from './types';
import { createKey, decryptAndDeserialize, serializeAndEncrypt } from '../util';

const RedisStore = createRedisSession(session);

interface ConfigureOptions {
  tenantStrategy: Strategy;
  sessionSecret: string;
  storeSecret: string;
  redisClient: RedisClient;
}

export function configurePassport(
  app: Application,
  passport: PassportStatic,
  { tenantStrategy, storeSecret, sessionSecret, redisClient }: ConfigureOptions
): session.Store {
  const key = createKey(storeSecret);
  const sessionSerializer = {
    stringify: function (data: unknown) {
      return serializeAndEncrypt(key, data);
    },
    parse: function (text: string) {
      return decryptAndDeserialize(key, text);
    },
  };

  const store = new RedisStore({
    client: redisClient,
    serializer: sessionSerializer,
  });
  app.use(
    session({
      name: 'adsp_tk_session',
      secret: sessionSecret,
      cookie: {
        secure: 'auto',
        sameSite: 'lax',
        httpOnly: true,
      },
      resave: false,
      saveUninitialized: false,
      store,
      unset: 'destroy',
    })
  );
  app.use(cookieParser(sessionSecret));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser(function (user, done) {
    done(null, user ? { ...user, tenantId: user.tenantId.toString() } : null);
  });

  passport.deserializeUser(function (user: Record<string, unknown>, done) {
    done(null, user ? ({ ...user, tenantId: AdspId.parse(user.tenantId as string) } as UserSessionData) : null);
  });
  passport.use('tenant', tenantStrategy);

  return store;
}
