import { AdspId, User } from '@abgov/adsp-service-sdk';
import type { Namespace } from '../types';
import { EventDefinitionEntity } from './definition';

export class NamespaceEntity implements Namespace {
  public name: string;
  public tenantId: AdspId;
  public definitions: { [name: string]: EventDefinitionEntity };

  constructor(namespace: Namespace) {
    this.tenantId = namespace.tenantId;
    this.name = namespace.name;
    this.definitions = Object.entries(namespace.definitions || {}).reduce(
      (defs, [name, definition]) => ({
        ...defs,
        [name]: new EventDefinitionEntity(this, { ...definition, name }),
      }),
      {}
    );
  }

  canSend(user: User): boolean {
    return user && (!this.tenantId || user.isCore || `${this.tenantId}` === `${user.tenantId}`);
  }
}
