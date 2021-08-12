import { AdspId, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, ValidationService } from '@core-services/core-common';
import { ConfigurationRepository } from '../repository';
import { ConfigurationServiceRoles } from '../roles';
import { ConfigurationRevision, ServiceConfiguration } from '../types';

/**
 * Represents an aggregate context for configuration revisions.
 *
 * @export
 * @class ServiceConfigurationEntity
 * @implements {ServiceConfiguration<C>}
 * @template C
 */
export class ServiceConfigurationEntity<C = Record<string, unknown>> implements ServiceConfiguration<C> {
  public revisions?: ConfigurationRevision<C>[] = [];

  constructor(
    public serviceId: AdspId,
    public repository: ConfigurationRepository,
    public validationService: ValidationService,
    public latest?: ConfigurationRevision<C>,
    public tenantId?: AdspId,
    schema?: Record<string, unknown>
  ) {
    validationService.setSchema(this.getSchemaKey(), schema || {});
  }

  public canAccess(user: User): boolean {
    return (
      (user?.roles?.includes(ConfigurationServiceRoles.ConfigurationAdmin) ||
        user?.roles?.includes(ConfigurationServiceRoles.Service) ||
        user?.roles?.includes(ConfigurationServiceRoles.Reader)) &&
      (user.isCore || !this.tenantId || this.tenantId.toString() === user.tenantId?.toString())
    );
  }

  public canModify(user: User): boolean {
    return (
      (user?.roles?.includes(ConfigurationServiceRoles.ConfigurationAdmin) ||
        user?.roles?.includes(ConfigurationServiceRoles.Service)) &&
      (this.tenantId ? this.tenantId.toString() === user.tenantId?.toString() : user.isCore)
    );
  }

  public async update(user: User, configuration: C): Promise<ServiceConfigurationEntity<C>> {
    if (!this.canModify(user)) {
      throw new UnauthorizedUserError('modify configuration', user);
    }

    if (!configuration) {
      throw new InvalidOperationError('Configuration must have a value.')
    }

    if (!this.validationService.validate(this.getSchemaKey(), configuration)) {
      throw new InvalidOperationError(`Provided configuration is not valid for service '${this.serviceId}'.`);
    }

    const revision: ConfigurationRevision<C> = {
      revision: this.latest?.revision || 0,
      configuration: configuration,
    };

    this.latest = await this.repository.saveRevision(this, revision);
    return this;
  }

  public async createRevision(user: User): Promise<ServiceConfigurationEntity<C>> {
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
    return this.serviceId.toString();
  }
}
