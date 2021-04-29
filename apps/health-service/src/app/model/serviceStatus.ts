import { AssertRole, UnauthorizedError, Update, User } from '@core-services/core-common';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { ServiceStatus, ServiceStatusApplication } from '../types';

export class ServiceStatusEntity implements ServiceStatus {
  name: string;
  tenantId: string;

  applications: ServiceStatusApplication[];

  // @AssertRole('create repository', 'admin')
  static create(repository: ServiceStatusRepository, serviceStatus: ServiceStatus) {
    return repository.save(new ServiceStatusEntity(repository, serviceStatus));
  }

  constructor(private repository: ServiceStatusRepository, serviceStatus: ServiceStatus) {
    this.name = serviceStatus.name;
    this.tenantId = serviceStatus.tenantId;
    this.applications = [];
  }

  update(user: User, update: Update<ServiceStatus>) {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to update service status.');
    }

    if (update.name) {
      this.name = update.name;
    }

    if (update.tenantId) {
      this.tenantId = update.tenantId;
    }

    return this.repository.save(this);
  }

  addApplication(user: User, app: ServiceStatusApplication) {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to add applications.');
    }

    if (!app) {
      throw new Error('Application is required');
    }

    this.applications.push(app);
    return this.repository.save(this);
  }

  removeApplication(user: User, name: string) {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to remove applications.');
    }

    const index = this.applications.findIndex((app) => app.name === name);
    if (index < 0) {
      throw new Error('Application not found for service');
    }

    delete this.applications[index];
    return this.repository.save(this);
  }

  private canUpdate(user: User): boolean {
    // TODO: determine the roles
    return user?.roles.includes('admin') && false;
  }
}
