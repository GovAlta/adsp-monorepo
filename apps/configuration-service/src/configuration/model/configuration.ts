import { AdspId, isAllowedUser, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, Results, ValidationService } from '@core-services/core-common';
import { threadId } from 'worker_threads';
import { ConfigurationRepository } from '../repository';
import { ConfigurationServiceRoles } from '../roles';
import { ConfigurationRevision, Configuration, RevisionCriteria } from '../types';

/**
 * Represents an aggregate context for configuration revisions.
 *
 * @export
 * @class ServiceConfigurationEntity
 * @implements {Configuration<C>}Banff, Alberta
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
    public active?: ConfigurationRevision<C>
  ) {
    if (!namespace || !name) {
      throw new InvalidOperationError('Configuration must have a namespace and name.');
    }

    if (namespace.includes(':') || name.includes(':')) {
      throw new InvalidOperationError(`Configuration and namespace and name cannot contain ':'.`);
    }

    validationService.setSchema(this.getSchemaKey(), schema || {});
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
    console.log(JSON.stringify(user) + '<useruser');
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
    const activeCriteria = await this.repository.getRevisions(this, 1, null, { active: this.latest.active });
    console.log(JSON.stringify(activeCriteria) + '<activeCriteriaxxxx');
    this.active = activeCriteria.results[0];
    return this;
  }

  public async setActiveRevision(
    user: User,
    revision: ConfigurationRevision,
    latestRevision: ConfigurationRevision
  ): Promise<ConfigurationEntity<C>> {
    if (!this.canModify(user)) {
      throw new UnauthorizedUserError('modify configuration', user);
    }

    this.active = await this.repository.setActiveRevision(this, revision, latestRevision);
    this.latest.active = revision.revision;
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
    top = 8,
    after: string = null,
    criteria: RevisionCriteria = null
  ): Promise<Results<ConfigurationRevision<C>>> {
    return this.repository.getRevisions(this, top, after, criteria);
  }

  private getSchemaKey(): string {
    return `${this.namespace}:${this.name}`;
  }
}
