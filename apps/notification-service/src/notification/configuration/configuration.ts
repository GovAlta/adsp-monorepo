import type { AdspId } from '@abgov/adsp-service-sdk';
import type { DomainEvent } from '@core-services/core-common';
import { Logger } from 'winston';
import { DirectNotificationTypeEntity, NotificationTypeEntity } from '../model';
import { NotificationType } from '../types';
import { Configuration, FromEmail, SupportContact } from './schema';
import { TemplateService } from '../template';
import { FileAttachmentService } from '../file';

function createTypeEntity(
  logger: Logger,
  templateService: TemplateService,
  fileService: FileAttachmentService,
  type: NotificationType,
  tenantId: AdspId
): NotificationTypeEntity {
  return type.addressPath || type.address
    ? new DirectNotificationTypeEntity(logger, templateService, fileService, type, tenantId)
    : new NotificationTypeEntity(logger, templateService, fileService, type, tenantId);
}

export class NotificationConfiguration {
  private types: Record<string, NotificationTypeEntity>;
  private eventTypes: Record<string, NotificationTypeEntity[]>;
  public contact: SupportContact;
  public email: FromEmail;

  constructor(
    logger: Logger,
    templateService: TemplateService,
    fileService: FileAttachmentService,
    tenantTypes: Configuration,
    coreTypes: Configuration,
    tenantId?: AdspId
  ) {
    const coreTypesEntities: Record<string, NotificationTypeEntity> = Object.entries(coreTypes).reduce(
      (entities, [typeId, type]: [string, NotificationType]) => {
        entities[typeId] = createTypeEntity(logger, templateService, fileService, type, tenantId);
        return entities;
      },
      {}
    );

    // Override core types with tenant configuration if it exists
    if (tenantTypes) {
      // remove contact, email from tenantTypes because it's a special type
      this.contact = tenantTypes?.contact;
      this.email = tenantTypes?.email;
      delete tenantTypes.contact;
      delete tenantTypes.email;

      this.types = Object.entries(tenantTypes).reduce((entities, [typeId, type]: [string, NotificationType]) => {
        const typeEntity = createTypeEntity(logger, templateService, fileService, type, tenantId);
        entities[typeId] = entities[typeId] ? entities[typeId].overrideWith(typeEntity) : typeEntity;
        return entities;
      }, coreTypesEntities);
    } else {
      this.types = coreTypesEntities;
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
