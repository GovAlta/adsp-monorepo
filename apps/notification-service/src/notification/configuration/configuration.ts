import type { AdspId } from '@abgov/adsp-service-sdk';
import type { DomainEvent } from '@core-services/core-common';
import { NotificationTypeEntity } from '../model';
import { Configuration, SupportContact } from './schema';

export class NotificationConfiguration {
  private types: Record<string, NotificationTypeEntity>;
  private eventTypes: Record<string, NotificationTypeEntity[]>;
  public contact: SupportContact;
  constructor({ contact, ...types }: Configuration, tenantId?: AdspId) {
    this.contact = contact;

    types = types || { contact: null };
    this.types = Object.keys(types).reduce((entities, key) => {
      entities[key] = new NotificationTypeEntity(types[key], tenantId);
      return entities;
    }, {});

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
