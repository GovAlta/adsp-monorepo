import { AdspId, User } from '@abgov/adsp-service-sdk';
import { ValidationService } from '@core-services/core-common';
import { DomainEventService } from '../service';
import type { Namespace } from '../types';
import { EventDefinitionEntity } from './definition';

export class NamespaceEntity implements Namespace {
  public name: string;
  public definitions: { [name: string]: EventDefinitionEntity };

  constructor(
    public service: DomainEventService,
    public validationService: ValidationService,
    namespace: Namespace,
    public tenantId: AdspId = null
  ) {
    this.tenantId = namespace.tenantId;
    this.name = namespace.name;
    this.definitions = Object.entries(namespace.definitions || {}).reduce((defs, [name, definition]) => {
      const entity = new EventDefinitionEntity(this, { ...definition, name });
      validationService.setSchema(entity.getSchemaKey(), entity.payloadSchema || {});
      return {
        ...defs,
        [name]: entity,
      };
    }, {});
  }

  canSend(user: User): boolean {
    return user && (!this.tenantId || user.isCore || `${this.tenantId}` === `${user.tenantId}`);
  }
}
