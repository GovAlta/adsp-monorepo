import { AdspId, isAllowedUser, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, Results, ValidationService, createLogger } from '@core-services/core-common';
import { ConfigurationRepository, ActiveRevisionRepository } from '../repository';
import { ConfigurationServiceRoles } from '../roles';
import { ConfigurationRevision, Configuration, RevisionCriteria, ActiveRevision } from '../types';
import type { Logger } from 'winston';
import { environment } from '../../environments/environment';

/**
 * Represents an aggregate context for configuration revisions.
 *
 * @export
 * @class ServiceConfigurationEntity
 * @implements {ActiveRevision}Banff, Alberta
 * @template C
 */
export class ActiveRevisionEntity implements ActiveRevision {
  constructor(
    public namespace: string,
    public name: string,
    public repository: ActiveRevisionRepository,
    public active: number,
    public tenantId?: AdspId,
    private logger?: Logger
  ) {
    if (!namespace || !name) {
      throw new InvalidOperationError('Configuration must have a namespace and name.');
    }

    if (namespace.includes(':') || name.includes(':')) {
      throw new InvalidOperationError(`Configuration and namespace and name cannot contain ':'.`);
    }

    if (!logger) {
      logger = createLogger('active-revision-modal', environment.LOG_LEVEL);
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

  public async setActiveRevision(user: User, active: number): Promise<ActiveRevision> {
    if (!this.canModify(user)) {
      throw new UnauthorizedUserError('modify configuration', user);
    }

    const activeRevision = await this.repository.setActiveRevision(this, active);

    this.active = activeRevision.active;
    return this;
  }
}
