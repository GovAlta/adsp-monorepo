import { User } from '@abgov/adsp-service-sdk';
import * as createRedisSession from 'connect-redis';
import { Application } from 'express';
import * as session from 'express-session';
import { PassportStatic, Strategy } from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import { RedisClient } from 'redis';

const RedisStore = createRedisSession(session);

interface ConfigureOptions {
  sessionSecret: string;
  redisClient?: RedisClient;
  tenantStrategy: Strategy;
}

export function configurePassport(
  app: Application,
  passport: PassportStatic,
  { sessionSecret, redisClient, tenantStrategy }: ConfigureOptions
) {
  const store = redisClient
    ? new RedisStore({
        client: redisClient,
      })
    : null;

  app.use(
    session({
      name: 'adsp_form_session',
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

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use('anonymous', new AnonymousStrategy());
  passport.use('tenant', tenantStrategy);
  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user as User);
  });
}
