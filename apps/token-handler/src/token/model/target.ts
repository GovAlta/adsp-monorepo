import { AdspId, ServiceDirectory, getContextTrace } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { Request, RequestHandler } from 'express';
import 'express-session';
import * as proxy from 'express-http-proxy';
import { OutgoingHttpHeaders, RequestOptions } from 'http';
import * as path from 'path';
import { Logger } from 'winston';

import { Target, UserSessionData } from '../types';
import { AuthenticationClient } from './client';

export class TargetProxy {
  id: string;
  upstream: AdspId;
  private proxyHandler: RequestHandler;

  constructor(
    private logger: Logger,
    private client: AuthenticationClient,
    private directory: ServiceDirectory,
    target: Target
  ) {
    this.id = target.id;
    this.upstream = target.upstream;
  }

  async getUserToken(req: Request) {
    const { accessToken, exp } = req.user as UserSessionData;

    // If access token is within 60 seconds of expiring, then refresh it.
    if (exp * 1000 - Date.now() < 60000) {
      const accessToken = await this.client.refreshTokens(req);
      return accessToken;
    } else {
      return accessToken;
    }
  }

  decorateRequest = async (opts: RequestOptions, req: Request): Promise<RequestOptions> => {
    const accessToken = await this.getUserToken(req);
    (opts.headers as OutgoingHttpHeaders).Authorization = `Bearer ${accessToken}`;

    const trace = getContextTrace();
    if (trace) {
      opts.headers['traceparent'] = trace.toString();
    }

    return opts;
  };

  resolveRequestPath(upstreamUrl: URL, req: Request): string {
    const relative = req.originalUrl.substring(`/token-handler/v1/targets/${this.id}`.length);
    const targetPath = path.join(upstreamUrl.pathname, relative);

    this.logger.debug(`Proxy request against target (ID: ${this.id}) from ${relative} to ${targetPath}`, {
      context: 'TargetProxy',
      tenant: this.client.tenantId.toString(),
    });

    return targetPath;
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
        proxyReqOptDecorator: this.decorateRequest,
        proxyReqPathResolver: (req) => this.resolveRequestPath(upstreamUrl, req),
      });
    }

    return this.proxyHandler;
  }
}
