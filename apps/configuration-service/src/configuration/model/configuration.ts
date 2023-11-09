import { AdspId, isAllowedUser, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, Results, ValidationService } from '@core-services/core-common';
import { ConfigurationRepository, ActiveRevisionRepository } from '../repository';
import { ConfigurationServiceRoles } from '../roles';
import { ConfigurationRevision, Configuration, RevisionCriteria } from '../types';
import type { Logger } from 'winston';

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
    private logger: Logger,
    public repository: ConfigurationRepository,
    private activeRevisionRepository: ActiveRevisionRepository,
    public validationService: ValidationService,
    public latest?: ConfigurationRevision<C>,
    public tenantId?: AdspId,
    private schema?: Record<string, unknown>,
    public active?: number
  ) {
    if (!namespace || !name) {
      throw new InvalidOperationError('Configuration must have a namespace and name.');
    }

    if (namespace.includes(':') || name.includes(':')) {
      throw new InvalidOperationError(`Configuration and namespace and name cannot contain ':'.`);
    }

    try {
      validationService.setSchema(this.getSchemaKey(), schema);
      return;
    } catch {
      this.logger.warn(`JSON schema of ${namespace}:${name} is invalid. An empty JSON schema {} will be used.`);
    }

    /**
      Initialize the ConfigurationEntity with empty schema if schema is mis-configured or not provided.
    */
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
    return isAllowedUser(user, this.tenantId, ConfigurationServiceRoles.ConfigurationAdmin, true);
  }

  public canRegister(user: User): boolean {
    return isAllowedUser(user, this.tenantId, ConfigurationServiceRoles.ConfiguredService, true);
  }

  public mergeUpdate(update: Partial<C>): C {
    return Object.entries(update).reduce(
      (config, [key, value]) => {
        // If current value plus update value are both objects, then combine them with spread operator.
        if (typeof config[key] === 'object' && typeof value === 'object') {
          value = { ...config[key], ...value };
        }

        config[key] = value;
        return config;
      },
      { ...this.latest?.configuration }
    );
  }

  public async update(user: User, configuration: C): Promise<ConfigurationEntity<C>> {
    if (!this.canModify(user) && !this.canRegister(user)) {
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
      lastUpdated: new Date(),
      created: this.latest?.created || new Date(),
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
      created: new Date(),
      lastUpdated: new Date(),
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

  public async setActiveRevision(user: User, active: number): Promise<ConfigurationEntity<C>> {
    if (!this.canModify(user)) {
      throw new UnauthorizedUserError('modify configuration', user);
    }

    this.active = (await this.activeRevisionRepository.setActiveRevision(this, active)).active;

    return this;
  }
}
