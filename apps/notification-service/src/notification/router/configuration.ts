import { AdspId, isAllowedUser, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { RequestHandler } from 'express';
import * as HttpStatusCodes from 'http-status-codes';
import { pick } from 'lodash';
import {
  NotificationConfiguration,
  NotificationConfigurationWriter,
  toNotificationTypeDefinition,
  validateNotificationType,
} from '../configuration';
import { NotificationType, ServiceUserRoles } from '../types';

export const TYPE_DEFINITION_SOURCES = ['tenant', 'core'];
export const CONTACT_FIELDS = ['contactEmail', 'phoneNumber', 'supportInstructions'];

function assertSubscriptionAdmin(user: User, tenantId: AdspId, operation: string): void {
  if (!isAllowedUser(user, tenantId, ServiceUserRoles.SubscriptionAdmin, true)) {
    throw new UnauthorizedUserError(operation, user);
  }
}

async function saveTypeDefinition(
  writer: NotificationConfigurationWriter,
  tenantId: AdspId,
  type: NotificationType,
): Promise<NotificationType> {
  const definition = toNotificationTypeDefinition(type);
  validateNotificationType(definition);
  await writer.update(tenantId, { [definition.id]: definition });
  return definition;
}

/**
 * Responds with the notification type definitions as configured when the source query parameter is set, and
 * otherwise passes the request on to the handler for the combined notification types.
 */
export const getNotificationTypeDefinitions: RequestHandler = async (req, res, next) => {
  try {
    const { source } = req.query;
    if (!source) {
      next();
      return;
    }

    assertSubscriptionAdmin(req.user, req.tenant?.id, 'get notification type definitions');
    const configuration = await req.getConfiguration<NotificationConfiguration, NotificationConfiguration>();
    res.json(source === 'core' ? configuration.getCoreDefinitions() : configuration.getTenantDefinitions());
  } catch (err) {
    next(err);
  }
};

export function createNotificationType(writer: NotificationConfigurationWriter): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenantId = req.tenant.id;
      assertSubscriptionAdmin(req.user, tenantId, 'create notification type');

      const configuration = await req.getConfiguration<NotificationConfiguration, NotificationConfiguration>();
      if (configuration.getNotificationType(req.body.id)) {
        throw new InvalidOperationError(`Notification type with ID '${req.body.id}' already exists.`, {
          statusCode: HttpStatusCodes.CONFLICT,
        });
      }

      const definition = await saveTypeDefinition(writer, tenantId, req.body);
      res.status(HttpStatusCodes.CREATED).json(definition);
    } catch (err) {
      next(err);
    }
  };
}

export function updateNotificationType(writer: NotificationConfigurationWriter): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenantId = req.tenant.id;
      const { type } = req.params;
      assertSubscriptionAdmin(req.user, tenantId, 'update notification type');

      // A platform type without a tenant customization is updated by saving a customization of it.
      const configuration = await req.getConfiguration<NotificationConfiguration, NotificationConfiguration>();
      const existing = configuration.getTenantDefinition(type) || configuration.getCoreDefinition(type);
      if (!existing) {
        throw new NotFoundError('Notification Type', type);
      }

      const definition = await saveTypeDefinition(writer, tenantId, { ...existing, ...req.body, id: type });
      res.json(definition);
    } catch (err) {
      next(err);
    }
  };
}

export function deleteNotificationType(writer: NotificationConfigurationWriter): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenantId = req.tenant.id;
      const { type } = req.params;
      assertSubscriptionAdmin(req.user, tenantId, 'delete notification type');

      // Platform types can't be deleted; deleting the tenant customization of one reverts it to the platform type.
      const configuration = await req.getConfiguration<NotificationConfiguration, NotificationConfiguration>();
      if (!configuration.getTenantDefinition(type)) {
        throw new NotFoundError('Notification Type', type);
      }

      await writer.delete(tenantId, type);
      res.json({ deleted: true });
    } catch (err) {
      next(err);
    }
  };
}

function mapContact(contact: Record<string, string>, fromEmail: string): Record<string, string> {
  return { ...pick(contact, CONTACT_FIELDS), fromEmail };
}

export const getContact: RequestHandler = async (req, res, next) => {
  try {
    assertSubscriptionAdmin(req.user, req.tenant.id, 'get notification contact');

    const configuration = await req.getConfiguration<NotificationConfiguration, NotificationConfiguration>();
    res.json(mapContact({ ...configuration.contact }, configuration.email?.fromEmail));
  } catch (err) {
    next(err);
  }
};

export function updateContact(writer: NotificationConfigurationWriter): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenantId = req.tenant.id;
      assertSubscriptionAdmin(req.user, tenantId, 'update notification contact');

      // The contact and from email are separate keys of the configuration, so only the keys with changes are saved.
      const configuration = await req.getConfiguration<NotificationConfiguration, NotificationConfiguration>();
      const contactChanges = pick(req.body, CONTACT_FIELDS);
      const { fromEmail } = req.body;
      const contact = { ...configuration.contact, ...contactChanges };
      const email = { ...configuration.email, ...(fromEmail !== undefined ? { fromEmail } : {}) };

      const update = {
        ...(Object.keys(contactChanges).length > 0 ? { contact } : {}),
        ...(fromEmail !== undefined ? { email } : {}),
      };
      if (Object.keys(update).length > 0) {
        await writer.update(tenantId, update);
      }

      res.json(mapContact(contact, email.fromEmail));
    } catch (err) {
      next(err);
    }
  };
}
