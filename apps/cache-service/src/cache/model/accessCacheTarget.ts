import { AdspId, ServiceDirectory, Tenant, TenantService } from '@abgov/adsp-service-sdk';
import { DomainEvent, InvalidOperationError, UnauthorizedError } from '@core-services/core-common';
import { Request, Response } from 'express';
import * as path from 'path';
import { Logger } from 'winston';
import { CacheProvider } from '../cacheProvider';
import { Target } from '../types';
import { accessApiId, isAdminEvent, ResourceType } from './access';
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
  private readonly basePathReady: Promise<void>;

  constructor(
    logger: Logger,
    directory: ServiceDirectory,
    tenantService: TenantService,
    provider: CacheProvider,
    tenantId: AdspId,
    target: Target,
  ) {
    super(logger, directory, provider, tenantId, target);

    if (this.serviceId.toString() !== accessApiId.toString()) {
      throw new Error(`Access cache target cannot be created against ${this.serviceId}`);
    }

    this.basePathReady = tenantService
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
    await this.basePathReady;

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
      await this.basePathReady;
      if (isAdminEvent(event)) {
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
            },
          );

          const [_key, invalidateKey] = await this.getCacheKey(resourcePath);
          const deleted = await this.provider.del(invalidateKey);

          const relatedPaths = this.getRelatedInvalidationPaths(resourceType, upstreamResourcePath);
          let relatedDeleted = 0;
          for (const relPath of relatedPaths) {
            const fullPath = path.join(this.basePath, relPath);
            this.logger.debug(
              `Invalidating related cache entry for path '${fullPath}' on admin event ${namespace}:${name}...`,
              {
                context: 'AccessCacheTarget',
                tenant: this.tenantId.toString(),
              },
            );
            const [_k, relInvalidateKey] = await this.getCacheKey(fullPath);
            if (await this.provider.del(relInvalidateKey)) {
              relatedDeleted++;
            }
          }

          if (deleted || relatedDeleted > 0) {
            this.logger.info(
              `Invalidated cache entry ${deleted} and ${relatedDeleted} related entries for path ` +
                `'${resourcePath}' on admin event ${namespace}:${name}.`,
              {
                context: 'AccessCacheTarget',
                tenant: this.tenantId.toString(),
              },
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
        },
      );
    }
  }

  /**
   * Derives cache paths to invalidate in addition to the direct resourcePath.
   * Covers both simple collection invalidation (e.g. USER → users) and the
   * multi-resource invalidation required for membership changes.
   */
  private getRelatedInvalidationPaths(resourceType: ResourceType, resourcePath: string): string[] {
    // Strip a leading slash so split('/') produces clean segments.
    const segments = resourcePath.replace(/^\//, '').split('/');
    const related = new Set<string>();

    switch (resourceType) {
      case 'CLIENT':
        related.add('clients');
        break;
      case 'GROUP':
        // Typical path: groups/{groupId}
        // Also used for children operations: groups/{groupId}/children
        related.add('groups');
        related.add('groups/count');

        if (segments[0] === 'groups' && segments[1]) {
          const groupId = segments[1];
          related.add(`groups/${groupId}/members`);
          related.add(`groups/${groupId}/children`);
        }
        break;
      case 'REALM_ROLE':
        // Typical path: roles/{roleName}
        // Also emitted for roles-by-id/{roleId} operations.
        related.add('roles');

        if (segments[0] === 'roles' && segments[1]) {
          const roleName = segments[1];
          related.add(`roles/${roleName}/composites`);
          related.add(`roles/${roleName}/composites/realm`);
          related.add(`roles/${roleName}/users`);
          related.add(`roles/${roleName}/groups`);
        }
        break;
      case 'CLIENT_ROLE':
        // Typical path: clients/{clientUuid}/roles/{roleName}
        // Also emitted for roles-by-id/{roleId} operations where clientUuid is unavailable.
        related.add('clients');

        if (segments[0] === 'clients' && segments[1]) {
          const clientId = segments[1];
          related.add(`clients/${clientId}`);
          related.add(`clients/${clientId}/roles`);

          if (segments[2] === 'roles' && segments[3]) {
            const roleName = segments[3];
            related.add(`clients/${clientId}/roles/${roleName}/composites`);
            related.add(`clients/${clientId}/roles/${roleName}/composites/realm`);
            related.add(`clients/${clientId}/roles/${roleName}/users`);
            related.add(`clients/${clientId}/roles/${roleName}/groups`);
          }
        }
        break;
      case 'USER':
        // Typical path: users/{userId}
        related.add('users');
        related.add('users/count');

        if (segments[0] === 'users' && segments[1]) {
          const userId = segments[1];
          related.add(`users/${userId}/role-mappings`);
          related.add(`users/${userId}/groups`);
          related.add(`users/${userId}/groups/count`);
        }
        break;

      case 'REALM_ROLE_MAPPING':
      case 'CLIENT_ROLE_MAPPING': {
        // Paths look like:
        //   users/{id}/role-mappings/realm
        //   users/{id}/role-mappings/clients/{clientId}
        //   groups/{id}/role-mappings/realm
        //   groups/{id}/role-mappings/clients/{clientId}
        // These events do not identify the affected role by name, so reverse membership
        // listings such as roles/{roleName}/users cannot be invalidated here.
        const [rootCollection, rootId] = segments;
        if (rootId) {
          related.add(`${rootCollection}/${rootId}/role-mappings`);
          related.add(`${rootCollection}/${rootId}`);
        }
        if (rootCollection) {
          related.add(rootCollection);
        }
        break;
      }
      case 'REALM_SCOPE_MAPPING':
      case 'CLIENT_SCOPE_MAPPING': {
        // Paths look like:
        //   users/{id}/scope-mappings/realm
        //   users/{id}/scope-mappings/clients/{clientId}
        //   groups/{id}/scope-mappings/realm
        //   groups/{id}/scope-mappings/clients/{clientId}
        //   client-scopes/{id}/scope-mappings/realm
        //   client-scopes/{id}/scope-mappings/clients/{clientId}
        const [rootCollection, rootId] = segments;
        if (rootId) {
          related.add(`${rootCollection}/${rootId}/scope-mappings`);
          related.add(`${rootCollection}/${rootId}`);
        }
        if (rootCollection) {
          related.add(rootCollection);
        }
        break;
      }
      case 'CLIENT_SCOPE_CLIENT_MAPPING': {
        // Paths look like:
        //   clients/{clientId}/default-client-scopes/{scopeId}
        //   clients/{clientId}/optional-client-scopes/{scopeId}
        related.add('clients');

        if (segments[0] === 'clients' && segments[1]) {
          const clientId = segments[1];
          related.add(`clients/${clientId}`);
          related.add(`clients/${clientId}/default-client-scopes`);
          related.add(`clients/${clientId}/optional-client-scopes`);

          const scopeId = segments[3];
          if (scopeId) {
            related.add('client-scopes');
            related.add(`client-scopes/${scopeId}`);
          }
        }
        break;
      }
      case 'GROUP_MEMBERSHIP': {
        // Path looks like: users/{userId}/groups/{groupId}
        const [, userId, , groupId] = segments;
        if (userId) {
          related.add(`users/${userId}`);
          related.add(`users/${userId}/groups`);
        }
        if (groupId) {
          related.add(`groups/${groupId}`);
          related.add(`groups/${groupId}/members`);
          related.add('groups');
        }
        related.add('users');
        break;
      }
      default:
        break;
    }

    return Array.from(related);
  }

  private setBasePath(tenant: Tenant) {
    this.basePath = `/cache/${this.serviceId}/${tenant.realm}/`;
  }
}
