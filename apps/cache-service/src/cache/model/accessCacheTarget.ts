import { AdspId, ServiceDirectory, Tenant, TenantService } from '@abgov/adsp-service-sdk';
import { DomainEvent, InvalidOperationError, UnauthorizedError } from '@core-services/core-common';
import { Request, Response } from 'express';
import * as path from 'path';
import { Logger } from 'winston';
import { CacheProvider } from '../cacheProvider';
import { Target } from '../types';
import { accessApiId, isAdminEvent } from './access';
import { CacheTarget } from './cacheTarget';

/**
 * Cache target for the access service admin API with specific rules for access and invalidation.
 *
 * @export
 * @class AccessCacheTarget
 * @extends {CacheTarget}
 */
export class AccessCacheTarget extends CacheTarget {
  static isAccessTarget(id: string): boolean {
    return id === accessApiId.toString();
  }

  private basePath: string;

  constructor(
    logger: Logger,
    directory: ServiceDirectory,
    tenantService: TenantService,
    provider: CacheProvider,
    tenantId: AdspId,
    target: Target
  ) {
    super(logger, directory, provider, tenantId, target);

    if (this.serviceId.toString() !== accessApiId.toString()) {
      throw new Error(`Access cache target cannot be created against ${this.serviceId}`);
    }

    tenantService
      .getTenant(tenantId)
      .then((tenant) => {
        this.setBasePath(tenant);
      })
      .catch((err) => {
        logger.error(`Error encountered getting tenant (ID: ${tenantId}): ${err}`, {
          context: 'AccessCacheTarget',
          tenant: tenantId.toString(),
        });
      });
  }

  override async get(req: Request, res: Response): Promise<void> {
    const { user, path } = req;

    if (!user) {
      throw new UnauthorizedError('Anonymous request through target is not allowed.');
    }

    if (!path.startsWith(this.basePath)) {
      throw new InvalidOperationError('Cannot request path for realm not matching the tenant context.');
    }

    return await super.get(req, res);
  }

  override async processEvent(event: DomainEvent): Promise<void> {
    const { namespace, name } = event;
    try {
      if (this.basePath && isAdminEvent(event)) {
        this.logger.debug(`Invalidating cache on admin event ${namespace}:${name}...`, {
          context: 'CacheTarget',
          tenant: this.tenantId.toString(),
        });

        const { resourceType, resourcePath: upstreamResourcePath } = event.payload;
        if (upstreamResourcePath) {
          const resourcePath = path.join(this.basePath, upstreamResourcePath);
          this.logger.info(
            `Invalidating cache entry for path '${resourcePath}' on admin event ${namespace}:${name}...`,
            {
              context: 'AccessCacheTarget',
              tenant: this.tenantId.toString(),
            }
          );

          const [_key, invalidateKey] = await this.getCacheKey(resourcePath);
          const deleted = await this.provider.del(invalidateKey);

          let collectionResource;
          switch (resourceType) {
            case 'CLIENT':
              collectionResource = 'clients';
              break;
            case 'GROUP':
              collectionResource = 'groups';
              break;
            case 'REALM_ROLE':
              collectionResource = 'roles';
              break;
            case 'CLIENT_ROLE':
              collectionResource = 'clients';
              break;
            case 'USER':
              collectionResource = 'users';
              break;
            default:
              break;
          }

          let collectionDeleted = false;
          if (collectionResource) {
            const collectionResourcePath = path.join(this.basePath, collectionResource);
            this.logger.debug(
              `Invalidating cache entry for collection path '${collectionResourcePath}' on admin event ${namespace}:${name}...`,
              {
                context: 'AccessCacheTarget',
                tenant: this.tenantId.toString(),
              }
            );

            const [_key, invalidateKey] = await this.getCacheKey(collectionResourcePath);
            collectionDeleted = await this.provider.del(invalidateKey);
          }

          if (deleted || collectionDeleted) {
            this.logger.info(
              `Invalidated cache entry ${deleted} and collection entry ${collectionDeleted} for path ` +
                `'${resourcePath}' on admin event ${namespace}:${name}.`,
              {
                context: 'AccessCacheTarget',
                tenant: this.tenantId.toString(),
              }
            );
          }
        }
      }
    } catch (err) {
      this.logger.warn(
        `Error encountered processing admin event '${namespace}:${name}' for invalidation in target '${this.serviceId}': ${err}`,
        {
          context: 'AccessCacheTarget',
          tenant: this.tenantId.toString(),
        }
      );
    }
  }

  private setBasePath(tenant: Tenant) {
    this.basePath = `/cache/${this.serviceId}/${tenant.realm}/`;
  }
}
