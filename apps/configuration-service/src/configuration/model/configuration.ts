import { AdspId, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, ValidationService } from '@core-services/core-common';
import { ConfigurationRepository } from '../repository';
import { ConfigurationServiceRoles } from '../roles';
import { ConfigurationRevision, Configuration } from '../types';

/**
 * Represents an aggregate context for configuration revisions.
 *
 * @export
 * @class ServiceConfigurationEntity
 * @implements {Configuration<C>}
 * @template C
 */
export class ConfigurationEntity<C = Record<string, unknown>> implements Configuration<C> {
  public revisions?: ConfigurationRevision<C>[] = [];

  constructor(
    public namespace: string,
    public name: string,
    public repository: ConfigurationRepository,
    public validationService: ValidationService,
    public latest?: ConfigurationRevision<C>,
    public tenantId?: AdspId,
    schema?: Record<string, unknown>
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
    return (
      (user?.roles?.includes(ConfigurationServiceRoles.ConfigurationAdmin) ||
        user?.roles?.includes(ConfigurationServiceRoles.ConfiguredService) ||
        user?.roles?.includes(ConfigurationServiceRoles.Reader)) &&
      (user.isCore || !this.tenantId || this.tenantId.toString() === user.tenantId?.toString())
    );
  }

  public canModify(user: User): boolean {
    return (
      (user?.roles?.includes(ConfigurationServiceRoles.ConfigurationAdmin) ||
        user?.roles?.includes(ConfigurationServiceRoles.ConfiguredService)) &&
      (this.tenantId ? this.tenantId.toString() === user.tenantId?.toString() : user.isCore)
    );
  }

  public async update(user: User, configuration: C): Promise<ConfigurationEntity<C>> {
    if (!this.canModify(user)) {
      throw new UnauthorizedUserError('modify configuration', user);
    }

    if (!configuration) {
      throw new InvalidOperationError('Configuration must have a value.');
    }

    if (!this.validationService.validate(this.getSchemaKey(), configuration)) {
      throw new InvalidOperationError(`Provided configuration is not valid for '${this.namespace}:${this.name}'.`);
    }

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

  private getSchemaKey(): string {
    return `${this.namespace}:${this.name}`;
  }
}
