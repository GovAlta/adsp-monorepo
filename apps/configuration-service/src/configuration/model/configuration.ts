import { AdspId, isAllowedUser, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, Results, ValidationService, createLogger } from '@core-services/core-common';
import { ConfigurationRepository } from '../repository';
import { ConfigurationServiceRoles } from '../roles';
import { ConfigurationRevision, Configuration, RevisionCriteria } from '../types';
import type { Logger } from 'winston';
import { environment } from './../../environments/environment';

/**
 * Represents an aggregate context for configuration revisions.
 *
 * @export
 * @class ServiceConfigurationEntity
 * @implements {Configuration<C>}
 * @template C
 */
export class ConfigurationEntity<C = Record<string, unknown>> implements Configuration<C> {
  constructor(
    public namespace: string,
    public name: string,
    public repository: ConfigurationRepository,
    public validationService: ValidationService,
    public latest?: ConfigurationRevision<C>,
    public tenantId?: AdspId,
    private schema?: Record<string, unknown>,
    private logger?: Logger
  ) {
    if (!namespace || !name) {
      throw new InvalidOperationError('Configuration must have a namespace and name.');
    }

    if (namespace.includes(':') || name.includes(':')) {
      throw new InvalidOperationError(`Configuration and namespace and name cannot contain ':'.`);
    }

    if (!logger) {
      logger = createLogger('configuration-service-modal', environment.LOG_LEVEL);
    }

    try {
      validationService.setSchema(this.getSchemaKey(), schema);
      return;
    } catch {
      logger.warn(`JSON schema of ${namespace}:${name} is invalid. An empty JSON schema {} will be used.`);
    }

    try {
      validationService.setSchema(this.getSchemaKey(), {});
    } catch (err) {
      throw new InvalidOperationError(`Failed in adding empty schema {}: ${err.message}`);
    }
  }

  public canAccess(user: User): boolean {
    return isAllowedUser(
      user,
      this.tenantId,
      [
        ConfigurationServiceRoles.ConfiguredService,
        ConfigurationServiceRoles.ConfigurationAdmin,
        ConfigurationServiceRoles.Reader,
      ],
      true
    );
  }

  public canModify(user: User): boolean {
    return isAllowedUser(
      user,
      this.tenantId,
      [ConfigurationServiceRoles.ConfiguredService, ConfigurationServiceRoles.ConfigurationAdmin],
      true
    );
  }

  public mergeUpdate(update: Partial<C>): C {
    return Object.entries(update).reduce(
      (update, [key, value]) => {
        // If schema indicates this top level property is an object, and current value plus update value are both objects,
        // then combine them with spread operator.
        if (
          this.schema?.properties?.[key]?.type === 'object' &&
          typeof update[key] === 'object' &&
          typeof value === 'object'
        ) {
          value = { ...update[key], ...value };
        }

        update[key] = value;
        return update;
      },
      { ...this.latest?.configuration }
    );
  }

  public async update(user: User, configuration: C): Promise<ConfigurationEntity<C>> {
    if (!this.canModify(user)) {
      throw new UnauthorizedUserError('modify configuration', user);
    }

    if (!configuration) {
      throw new InvalidOperationError('Configuration must have a value.');
    }

    this.validationService.validate(
      `configuration '${this.namespace}:${this.name}'`,
      this.getSchemaKey(),
      configuration
    );

    const revision: ConfigurationRevision<C> = {
      revision: this.latest?.revision || 0,
      configuration: configuration,
    };

    this.latest = await this.repository.saveRevision(this, revision);
    return this;
  }

  public async createRevision(user: User): Promise<ConfigurationEntity<C>> {
    if (!this.canModify(user)) {
      throw new UnauthorizedUserError('modify configuration', user);
    }

    const newRevision: ConfigurationRevision<C> = {
      revision: this.latest ? this.latest.revision + 1 : 0,
      configuration: this.latest?.configuration || ({} as C),
    };

    this.latest = await this.repository.saveRevision(this, newRevision);
    return this;
  }

  public async getRevisions(
    top = 10,
    after: string = null,
    criteria: RevisionCriteria = null
  ): Promise<Results<ConfigurationRevision<C>>> {
    return this.repository.getRevisions(this, top, after, criteria);
  }

  private getSchemaKey(): string {
    return `${this.namespace}:${this.name}`;
  }
}
