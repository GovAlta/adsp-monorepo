import { AdspId, ServiceDirectory } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Request, RequestHandler } from 'express';
import * as proxy from 'express-http-proxy';
import * as path from 'path';

import { Target, UserSessionData } from '../types';
import { TokenHandlerConfiguration } from '../configuration';

export class TargetProxy implements Target {
  id: string;
  upstream: AdspId;
  private proxyHandler: RequestHandler;

  constructor(private config: TokenHandlerConfiguration, private directory: ServiceDirectory, target: Target) {
    this.id = target.id;
    this.upstream = target.upstream;
  }

  async getUserToken(req: Request) {
    const { accessToken, exp, authenticatedBy } = req.user as UserSessionData;

    // If access token is within 60 seconds of expiring, then refresh it.
    if (exp * 1000 - Date.now() < 60000) {
      const client = this.config.getClient(authenticatedBy);
      if (!client) {
        // If client is no longer in the configuration, then fail the refresh.
        throw new NotFoundError('client', authenticatedBy);
      }

      const accessToken = await client.refreshTokens(req);
      return accessToken;
    } else {
      return accessToken;
    }
  }

  async getProxyHandler() {
    if (!this.proxyHandler) {
      const upstreamUrl = await this.directory.getServiceUrl(this.upstream);
      if (!upstreamUrl) {
        throw new InvalidOperationError(
          `Target (ID: ${this.id}) upstream ${this.upstream} cannot be resolved by the service directory. Did you register the service or API?`
        );
      }

      const baseUrl = new URL('', upstreamUrl);
      this.proxyHandler = proxy(baseUrl.href, {
        proxyReqOptDecorator: async (opts, req) => {
          const accessToken = await this.getUserToken(req);
          opts.headers.Authorization = `Bearer ${accessToken}`;

          return opts;
        },
        proxyReqPathResolver: (req) => {
          const [_, ...relative] = req.url.split(this.id);

          const targetPath = path.join(upstreamUrl.pathname, ...relative);
          const targetUrl = new URL(targetPath, baseUrl);

          return targetUrl.pathname;
        },
      });
    }

    return this.proxyHandler;
  }
}
