import { User } from '@abgov/adsp-service-sdk';
import { errors } from '@strapi/utils';
import { Request } from 'express';
import type { Context } from 'koa';
import type { Strategy, StrategyFailure } from 'passport';
import type { Logger } from 'winston';

interface Auth {
  authenticated?: boolean;
  credentials?: User;
  error?: unknown;
}

export class StrategyAdapter<T extends Strategy> {
  constructor(
    private logger: Logger,
    private name: string,
    private strategy: T,
  ) {}

  get() {
    return {
      name: this.name,
      authenticate: async (ctx: Context) => {
        return await new Promise<Auth>((resolve) => {
          this.strategy['success'] = function (user: Express.User) {
            ctx.state.user = user;
            resolve({
              authenticated: true,
              credentials: user,
            });
          };

          this.strategy['fail'] = function (challenge?: StrategyFailure, _status?: number) {
            resolve({ error: new errors.UnauthorizedError(challenge?.message) });
          };

          this.strategy['redirect'] = function (_url: string, _status?: number) {
            resolve(undefined);
          };

          this.strategy['pass'] = function () {
            resolve(undefined);
          };
          this.strategy['error'] = (err: unknown) => {
            this.logger.debug(`Error encountered in strategy authenticate: ${err}`);
            // Return undefined so that the next strategy can be tried.
            resolve(undefined);
          };

          // @ts-expect-error Typing not compatible.
          this.strategy.authenticate(ctx.req as Request);
        });
      },
      verify: (auth: Auth, _config: { scope: string[] }) => {
        const { credentials: _user } = auth;
      },
    };
  }
}
