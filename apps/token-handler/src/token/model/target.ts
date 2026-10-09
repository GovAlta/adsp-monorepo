import { AdspId, ServiceDirectory, getContextTrace } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { Request, RequestHandler } from 'express';
import 'express-session';
import * as proxy from 'express-http-proxy';
import { OutgoingHttpHeaders, RequestOptions } from 'http';
import { Logger } from 'winston';

import { Target, UserSessionData } from '../types';
import { AuthenticationClient } from './client';

// Headers that belong to the token handler session or the incoming request's credentials and must not reach the
// upstream; the upstream is only given the user's access token.
const STRIPPED_REQUEST_HEADERS = [
  'authorization',
  'proxy-authorization',
  'cookie',
  'x-xsrf-token',
  'x-adsp-tenant',
  // Trace context is set from the current context only.
  'traceparent',
  'tracestate',
];

// Upstream cookies and site data directives are not passed on, so that upstreams cannot change the cookies or
// stored data of the token handler's origin.
const STRIPPED_RESPONSE_HEADERS = ['set-cookie', 'set-cookie2', 'clear-site-data'];

const MAX_DECODE_ITERATIONS = 3;

/**
 * Checks if a path segment could alter the path once decoded by the upstream: dot segments, encoded separators,
 * null characters, path parameters on dot segments (e.g. '..;'), and malformed encoding. The segment is checked at
 * each level of decoding in case the upstream (or a proxy in front of it) decodes more than once.
 */
function isUnsafePathSegment(segment: string): boolean {
  let value = segment;
  for (let i = 0; i < MAX_DECODE_ITERATIONS; i++) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(value);
    } catch {
      // The segment itself must be validly encoded, but a decoded value can legitimately contain '%'.
      return i === 0;
    }

    const [name] = decoded.split(';');
    if (name === '.' || name === '..' || /[\\/\0]/.test(decoded)) {
      return true;
    }

    if (decoded === value) {
      break;
    }
    value = decoded;
  }

  return false;
}

export class TargetProxy {
  id: string;
  upstream: AdspId;
  private proxyHandler: RequestHandler;

  constructor(
    private logger: Logger,
    private client: AuthenticationClient,
    private directory: ServiceDirectory,
    target: Target,
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

    const headers = opts.headers as OutgoingHttpHeaders;
    for (const name of Object.keys(headers)) {
      if (STRIPPED_REQUEST_HEADERS.includes(name.toLowerCase())) {
        delete headers[name];
      }
    }
    headers.Authorization = `Bearer ${accessToken}`;

    const trace = getContextTrace();
    if (trace) {
      opts.headers['traceparent'] = trace;
    }

    return opts;
  };

  decorateResponseHeaders = (headers: OutgoingHttpHeaders): OutgoingHttpHeaders => {
    return Object.fromEntries(
      Object.entries(headers).filter(([name]) => !STRIPPED_RESPONSE_HEADERS.includes(name.toLowerCase()))
    );
  };

  resolveRequestPath(upstreamUrl: URL, req: Request): string {
    // The target ID segment may be percent-encoded, so it is matched rather than measured.
    const relativeUrl = req.originalUrl.replace(/^\/token-handler\/v1\/targets\/[^/?]*/i, '');

    // The query is not part of the path and must not be normalized with it.
    const queryStart = relativeUrl.indexOf('?');
    const relativePath = queryStart < 0 ? relativeUrl : relativeUrl.substring(0, queryStart);
    const query = queryStart < 0 ? '' : relativeUrl.substring(queryStart);

    // Requests must stay within the upstream's base path.
    if (relativePath.split('/').some(isUnsafePathSegment)) {
      throw new InvalidOperationError('Request path is not valid.');
    }

    const basePath = upstreamUrl.pathname.replace(/\/+$/, '');
    const relative = relativePath.replace(/^\/+/, '').replace(/\/{2,}/g, '/');
    const targetPath = relativePath ? `${basePath}/${relative}` : basePath || '/';

    return targetPath + query;
  }

  async getProxyHandler() {
    if (!this.proxyHandler) {
      const upstreamUrl = await this.directory.getServiceUrl(this.upstream);
      if (!upstreamUrl) {
        throw new InvalidOperationError(
          `Target (ID: ${this.id}) upstream ${this.upstream} cannot be resolved by the service directory. Did you register the service or API?`,
        );
      }

      const baseUrl = new URL('', upstreamUrl);
      const proxyHandler = proxy(baseUrl.href, {
        proxyReqOptDecorator: this.decorateRequest,
        proxyReqPathResolver: (req) => {
          const targetPath = this.resolveRequestPath(upstreamUrl, req);

          // The query string is not logged.
          this.logger.debug(`Proxy request against target (ID: ${this.id}) to ${targetPath.split('?')[0]}`, {
            context: 'TargetProxy',
            tenant: this.client.tenantId.toString(),
          });

          return targetPath;
        },
        userResHeaderDecorator: this.decorateResponseHeaders,
      });

      this.proxyHandler = (req, res, next) => {
        try {
          // Reject invalid request paths before proxying.
          this.resolveRequestPath(upstreamUrl, req);
        } catch (err) {
          next(err);
          return;
        }

        proxyHandler(req, res, next);
      };
    }

    return this.proxyHandler;
  }
}
