import {
  AdspId,
  getContextTrace,
  isAllowedUser,
  ServiceDirectory,
  UnauthorizedUserError,
  User,
} from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Request, Response } from 'express';
import * as hasha from 'hasha';
import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import * as path from 'path';
import { ParsedQs } from 'qs';
import { Logger } from 'winston';
import { CacheProvider } from '../cacheProvider';
import { ServiceRoles } from '../roles';
import { CachedResponse, Target } from '../types';

const MAX_CACHED_CONTENT_LENGTH = 500 * 1024;
const MAPPED_HEADERS = ['Content-Type', 'Content-Encoding', 'Content-Length', 'Cache-Control', 'Content-Disposition'];
const ADSP_CACHE_HEADER = 'adsp-cache-status';
const TRACE_PARENT_HEADER = 'traceparent';

export class CacheTarget implements Target {
  serviceId: AdspId;
  ttl: number;

  constructor(
    private logger: Logger,
    private directory: ServiceDirectory,
    private provider: CacheProvider,
    private tenantId: AdspId,
    target: Target
  ) {
    this.serviceId = target.serviceId;
    this.ttl = target.ttl;
  }

  async get(req: Request, res: Response) {
    const { method, headers, tenant, user, path, query } = req;
    if (method !== 'GET') {
      throw new InvalidOperationError('request is not a GET.');
    }

    // Client needs to support gzip content encoding, since we're not deflating the response from upstream when caching.
    const acceptEncoding = headers['accept-encoding'];
    if (acceptEncoding && !acceptEncoding.includes('gzip') && !acceptEncoding.includes('*')) {
      throw new InvalidOperationError('client must accept gzip encoding.');
    }

    // Cache entries are per-user but shared for anonymous users.
    // When request is under a user context, the user needs the cache-reader role.
    // Anonymous users can make the request, and result from upstream will also be in an anonymous context.
    if (user && !isAllowedUser(user, this.tenantId, ServiceRoles.CacheReader, true)) {
      throw new UnauthorizedUserError('read through cache', user);
    }

    const key = await this.getCacheKey(path, query, user);
    const cached = await this.provider.get(key);
    if (cached) {
      res
        .status(cached.status)
        .header({ ...cached.headers, [ADSP_CACHE_HEADER]: 'HIT' })
        .send(cached.content);

      this.logger.debug(`Cache hit for request to ${path}.`, {
        context: 'CacheTarget',
        tenant: tenant?.id?.toString(),
        user: user ? `${user.name} (ID: ${user.id})` : null,
      });
    } else {
      this.logger.info(`Cache miss for request to ${path}. Making request to upstream...`, {
        context: 'CacheTarget',
        tenant: tenant?.id?.toString(),
        user: user ? `${user.name} (ID: ${user.id})` : null,
      });

      const response = await this.getUpstream(req, res);
      if (response) {
        await this.provider.set(key, this.ttl, response);

        this.logger.info(
          `Cached upstream response (status: ${response.status}) for request to ${path} with TTL ${this.ttl}.`,
          {
            context: 'CacheTarget',
            tenant: tenant?.id?.toString(),
            user: user ? `${user.name} (ID: ${user.id})` : null,
          }
        );
      }
    }
  }

  private async getCacheKey(path: string, query: ParsedQs, user?: User): Promise<string> {
    return hasha(
      JSON.stringify({
        path,
        query,
        user: user
          ? {
              tenantId: user.tenantId?.toString(),
              id: user.id,
              roles: user.roles,
              aud: user.token.aud,
              scope: user.token.scope,
            }
          : null,
      })
    );
  }

  private async getUpstream(req: Request, res: Response): Promise<CachedResponse> {
    const { tenant, user, query } = req;
    const trace = getContextTrace();

    const upstreamUrl = await this.directory.getServiceUrl(this.serviceId);
    if (!upstreamUrl) {
      throw new NotFoundError('service or api', this.serviceId.toString());
    }

    const relative = req.originalUrl.substring(`${req.baseUrl}/cache/${this.serviceId}`.length);
    const targetPath = path.join(upstreamUrl.pathname, relative);
    if (!targetPath.includes(upstreamUrl.pathname)) {
      throw new InvalidOperationError('Request path not supported.');
    }

    const requestUrl = new URL(targetPath, upstreamUrl);
    const request = requestUrl.protocol === 'https:' ? httpsRequest : httpRequest;

    Object.entries(query).forEach(function ([name, value]) {
      requestUrl.searchParams.set(name, value.toString());
    });

    const result = await new Promise<CachedResponse>((resolve, reject) => {
      const requestHeaders = {
        'Accept-Encoding': 'gzip',
      };

      if (user?.token?.bearer) {
        requestHeaders['Authorization'] = `Bearer ${user.token.bearer}`;
      }

      if (trace) {
        // This is necessary because we're not using axios which the SDK sets up to pass forward the trace context.
        requestHeaders[TRACE_PARENT_HEADER] = trace.toString();
      }

      const upstreamReq = request(
        requestUrl,
        {
          headers: requestHeaders,
        },
        (upstreamRes) => {
          const status = upstreamRes.statusCode;
          const headers = this.getMappedHeaders(upstreamRes.headers);

          const chunks = [];

          // For status codes in the 500s, don't collect response data or cache since the result isn't necessarily
          // the same on subsequent requests.
          if (status < 500) {
            upstreamRes.on('data', (chunk) => {
              chunks.push(chunk);
            });
          }

          upstreamRes.on('end', () => {
            const content = Buffer.concat(
              chunks,
              chunks.reduce((len, chunk) => len + chunk.length, 0)
            );

            // Determine if we should cache based on content length.
            // Don't cache if there is no data or if there is too much.
            if (content.length > 0 && content.length < MAX_CACHED_CONTENT_LENGTH) {
              resolve({
                headers,
                status,
                content,
              });
            } else {
              this.logger.debug(
                `Content length ${content.length} outside of limits. Skipping caching of response from: ${requestUrl}`,
                {
                  context: 'CacheTarget',
                  tenant: tenant?.id?.toString(),
                  user: user ? `${user.name} (ID: ${user.id})` : null,
                }
              );

              resolve(null);
            }
          });

          upstreamRes.on('error', reject);

          res.status(status).header({ ...headers, [ADSP_CACHE_HEADER]: 'MISS' });
          upstreamRes.pipe(res);
        }
      );

      req.pipe(upstreamReq);
    });

    return result;
  }

  private getMappedHeaders(headers: Record<string, string | string[]>): Record<string, string | string[]> {
    return MAPPED_HEADERS.reduce(function (values, header) {
      const value = headers[header.toLowerCase()];
      if (value) {
        values[header] = value;
      }
      return values;
    }, {} as Record<string, string | string[]>);
  }
}
