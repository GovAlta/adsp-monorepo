import {
  AdspId,
  getContextTrace,
  isAllowedUser,
  ServiceDirectory,
  UnauthorizedUserError,
  User,
} from '@abgov/adsp-service-sdk';
import { DomainEvent, InvalidOperationError, NotFoundError } from '@core-services/core-common';

import { Request, Response } from 'express';
import * as hasha from 'hasha';
import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import * as _ from 'lodash';
import * as path from 'path';
import { ParsedQs } from 'qs';
import { Logger } from 'winston';
import { CacheProvider } from '../cacheProvider';
import { ServiceRoles } from '../roles';
import { CachedResponse, InvalidationEvent, Target } from '../types';

const DEFAULT_TTL = 15 * 60;
const MAX_CACHED_CONTENT_LENGTH = 1024 * 1024;
const MAPPED_HEADERS = ['Content-Type', 'Content-Encoding', 'Content-Length', 'Cache-Control', 'Content-Disposition'];
const ADSP_CACHE_HEADER = 'adsp-cache-status';
const TRACE_PARENT_HEADER = 'traceparent';

export class CacheTarget implements Target {
  serviceId: AdspId;
  ttl: number;
  invalidationEvents: InvalidationEvent[];

  constructor(
    protected logger: Logger,
    protected directory: ServiceDirectory,
    protected provider: CacheProvider,
    protected tenantId: AdspId,
    target: Target
  ) {
    this.serviceId = target.serviceId;
    this.ttl = typeof target.ttl === 'number' ? target.ttl : DEFAULT_TTL;
    this.invalidationEvents = target.invalidationEvents || [];
  }

  async get(req: Request, res: Response) {
    const { method, headers, user, path, query } = req;
    if (method !== 'GET') {
      throw new InvalidOperationError('request is not a GET.');
    }

    // Client needs to support gzip content encoding, since we're not deflating the response from upstream when caching.
    const acceptEncoding = headers['accept-encoding'];
    if (acceptEncoding && !acceptEncoding.includes('gzip') && !acceptEncoding.includes('*')) {
      throw new InvalidOperationError('client must accept gzip encoding.');
    }

    // Cache entries are per-user but shared for anonymous users.
    // When request is under a user context, the user needs a read role or the cache-reader role.
    // Anonymous users can make the request, and result from upstream will also be in an anonymous context.
    if (user && !isAllowedUser(user, this.tenantId, ServiceRoles.CacheReader, true)) {
      throw new UnauthorizedUserError('read through cache', user);
    }

    const [key, invalidateKey] = await this.getCacheKey(path, query, user);
    let cached;
    try {
      cached = await this.provider.get(key);
    } catch (err) {
      this.logger.warn(`Error encountered retrieving value from cache: ${err}`, err, {
        context: 'CacheTarget',
        tenant: this.tenantId.toString(),
        user: user ? `${user.name} (ID: ${user.id})` : null,
      });
    }

    if (cached) {
      res
        .status(cached.status)
        .header({ ...cached.headers, [ADSP_CACHE_HEADER]: 'HIT' })
        .send(cached.content);

      this.logger.debug(`Cache hit for request to ${path}.`, {
        context: 'CacheTarget',
        tenant: this.tenantId.toString(),
        user: user ? `${user.name} (ID: ${user.id})` : null,
      });
    } else {
      this.logger.info(`Cache miss for request to ${path}. Making request to upstream...`, {
        context: 'CacheTarget',
        tenant: this.tenantId.toString(),
        user: user ? `${user.name} (ID: ${user.id})` : null,
      });

      const response = await this.getUpstream(req, res);
      if (response) {
        if (response.status === 401) {
          // Note: Unfortunately transient server side issue causing token validation failure results in a 401.
          // In that case, the status code is in the 400s (i.e. client error), but the request may succeed on retry. Cache with a short TTL.
          await this.provider.set(key, invalidateKey, 30, response);
        } else {
          await this.provider.set(key, invalidateKey, this.ttl, response);
        }

        this.logger.info(
          `Cached upstream response (status: ${response.status}) for request to ${path} with TTL ${this.ttl}.`,
          {
            context: 'CacheTarget',
            tenant: this.tenantId.toString(),
            user: user ? `${user.name} (ID: ${user.id})` : null,
          }
        );
      }
    }
  }

  protected async getCacheKey(path: string, query: ParsedQs = {}, user?: User): Promise<[string, string?]> {
    return [
      // Cache key is based on the tenant, request path, query, and user context.
      hasha(
        JSON.stringify({
          tenantId: this.tenantId.toString(),
          path,
          query,
          user: user
            ? {
                id: user.id,
                roles: user.roles,
                aud: user.token.aud,
                scope: user.token.scope,
              }
            : null,
        })
      ),
      // Invalidation key is based on the tenant, and request path.
      hasha(
        JSON.stringify({
          tenantId: this.tenantId.toString(),
          path,
        })
      ),
    ];
  }

  private async getUpstream(req: Request, res: Response): Promise<CachedResponse> {
    const { user, query } = req;
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
                  tenant: this.tenantId.toString(),
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

  async processEvent({ namespace, name, payload }: DomainEvent): Promise<void> {
    try {
      const invalidationEvent = this.invalidationEvents.find(
        (invalidationEvent) => invalidationEvent.namespace === namespace && invalidationEvent.name == name
      );

      if (invalidationEvent) {
        this.logger.info(`Invalidating cache on event ${namespace}:${name}...`, {
          context: 'CacheTarget',
          tenant: this.tenantId.toString(),
        });

        const resourceIdPaths = Array.isArray(invalidationEvent.resourceIdPath)
          ? invalidationEvent.resourceIdPath
          : [invalidationEvent.resourceIdPath];

        const upstreamUrl = await this.directory.getServiceUrl(this.serviceId);
        for (const resourceIdPath of resourceIdPaths) {
          const resourceIdValue = _.get(payload, resourceIdPath) as string;
          const resourceId = AdspId.parse(resourceIdValue);
          if (resourceId.type === 'resource') {
            const resourceUrl = await this.directory.getResourceUrl(resourceId);
            const relative = path.relative(upstreamUrl.href, resourceUrl.href);

            const cachedPath = path.join(`/cache/${this.serviceId}/`, relative);
            const [_key, invalidateKey] = await this.getCacheKey(cachedPath);

            const deleted = await this.provider.del(invalidateKey);
            if (deleted) {
              this.logger.info(`Invalidated cache entry for path '${cachedPath}' on event ${namespace}:${name}.`, {
                context: 'CacheTarget',
                tenant: this.tenantId.toString(),
              });
            } else {
              this.logger.info(`No entries invalidated for path '${cachedPath}' on event ${namespace}:${name}.`, {
                context: 'CacheTarget',
                tenant: this.tenantId.toString(),
              });
            }
          }
        }
      }
    } catch (err) {
      this.logger.warn(
        `Error encountered processing event '${namespace}:${name}' for invalidation in target '${this.serviceId}': ${err}`,
        {
          context: 'CacheTarget',
          tenant: this.tenantId.toString(),
        }
      );
    }
  }
}
