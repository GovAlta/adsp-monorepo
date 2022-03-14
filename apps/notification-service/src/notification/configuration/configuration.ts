import type { AdspId } from '@abgov/adsp-service-sdk';
import type { DomainEvent } from '@core-services/core-common';
import { NotificationTypeEntity } from '../model';
import { Configuration, SupportContact } from './schema';

export class NotificationConfiguration {
  private types: Record<string, NotificationTypeEntity>;
  private eventTypes: Record<string, NotificationTypeEntity[]>;
  public contact: SupportContact;
  constructor(tenantTypes: Configuration, coreTypes: Configuration, tenantId?: AdspId) {
    const contact = tenantTypes?.contact;
    if (tenantTypes) {
      delete tenantTypes.contact;
      this.contact = contact;
    }

    const types = Object.entries(coreTypes).reduce((entities, [typeId, type]) => {
      entities[typeId] = new NotificationTypeEntity(type, tenantId);
      return entities;
    }, {});

    // Override core types with tenant configuration.
    if (tenantTypes) {
      this.types = Object.entries(tenantTypes).reduce((entities, [typeId, type]) => {
        const typeEntity = new NotificationTypeEntity(type, tenantId);
        entities[typeId] = entities[typeId] ? entities[typeId].overrideWith(typeEntity) : typeEntity;
        return entities;
      }, types);
    } else {
      this.types = types;
    }

    this.eventTypes = Object.keys(this.types).reduce((eventEntities, key) => {
      const type = this.types[key];
      type.events.forEach(({ namespace, name }) => {
        const eventKey = this.getEventKey(namespace, name);
        eventEntities[eventKey] = [...(eventEntities[eventKey] || []), type];
      });
      return eventEntities;
    }, {} as Record<string, NotificationTypeEntity[]>);
  }

  private getEventKey(namespace: string, name: string) {
    return `${namespace}:${name}`;
  }

  getNotificationTypes(): NotificationTypeEntity[] {
    return Object.keys(this.types).map((k) => this.types[k]);
  }

  getNotificationType(type: string): NotificationTypeEntity {
    return this.types[type];
  }

  getEventNotificationTypes({ namespace, name }: DomainEvent): NotificationTypeEntity[] {
    const key = this.getEventKey(namespace, name);
    return this.eventTypes[key] || [];
  }
}
