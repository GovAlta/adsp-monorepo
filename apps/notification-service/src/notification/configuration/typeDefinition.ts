import { InvalidOperationError } from '@core-services/core-common';
import { pick } from 'lodash';
import { Channel, NotificationType, NotificationTypeEvent } from '../types';

const IDENTIFIER_PATTERN = /^[a-zA-Z0-9-_ ]{1,50}$/;
// These keys of the configuration document hold the tenant contact settings, not notification types.
const RESERVED_TYPE_IDS = ['contact', 'email'];
const CHANNELS: string[] = Object.values(Channel);
const DEFINITION_FIELDS = ['id', 'name', 'publicSubscribe', 'manageSubscribe', 'subscriberRoles', 'channels', 'events'];
const OPTIONAL_STRING_FIELDS = [
  'description',
  'address',
  'addressPath',
  'ccPath',
  'bccPath',
  'attachmentPath',
  'subjectPath',
  'titlePath',
  'subTitlePath',
];

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || value === null || isString(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function validateTemplates(eventKey: string, templates: unknown): string[] {
  if (!templates || typeof templates !== 'object' || Array.isArray(templates)) {
    return [`event '${eventKey}' must have templates`];
  }

  return Object.entries(templates).flatMap(([channel, template]) => {
    if (!CHANNELS.includes(channel)) {
      return [`event '${eventKey}' has a template for unknown channel '${channel}'`];
    }
    // The configuration schema allows a channel's template to be null when the event does not use that channel.
    if (template === null) {
      return [];
    }
    return isString(template?.subject) && isString(template?.body)
      ? []
      : [`event '${eventKey}' ${channel} template must have a subject and body`];
  });
}

function validateEvents(events: unknown): string[] {
  if (!Array.isArray(events)) {
    return ['events must be an array'];
  }

  const eventKeys = new Set<string>();
  return events.flatMap((event: NotificationTypeEvent) => {
    if (!IDENTIFIER_PATTERN.test(event?.namespace) || !IDENTIFIER_PATTERN.test(event?.name)) {
      return ['each event must have a namespace and name of up to 50 letters, numbers, spaces, - or _'];
    }

    const eventKey = `${event.namespace}:${event.name}`;
    const errors = eventKeys.has(eventKey) ? [`event '${eventKey}' is included more than once`] : [];
    eventKeys.add(eventKey);
    return [...errors, ...validateTemplates(eventKey, event.templates)];
  });
}

function validateChannels(channels: unknown): string[] {
  if (!isStringArray(channels) || channels.length < 1) {
    return ['channels must include at least one channel'];
  }
  const unknown = channels.filter((channel) => !CHANNELS.includes(channel));
  return unknown.length > 0 ? [`channels includes unknown channel(s): ${unknown.join(', ')}`] : [];
}

function validateId(id: unknown): string[] {
  if (!isString(id) || !IDENTIFIER_PATTERN.test(id)) {
    return ['id must be up to 50 letters, numbers, spaces, - or _'];
  }
  return RESERVED_TYPE_IDS.includes(id) ? [`id '${id}' is reserved`] : [];
}

/**
 * Checks a notification type definition before it is saved, and throws a 400 error listing every problem found.
 */
export function validateNotificationType(type: NotificationType): void {
  const errors = [
    ...validateId(type.id),
    ...(isString(type.name) && type.name.trim() ? [] : ['name is required']),
    ...OPTIONAL_STRING_FIELDS.filter((field) => !isOptionalString(type[field])).map(
      (field) => `${field} must be a string`,
    ),
    ...(typeof type.publicSubscribe === 'boolean' ? [] : ['publicSubscribe must be a boolean']),
    ...(type.manageSubscribe === undefined || typeof type.manageSubscribe === 'boolean'
      ? []
      : ['manageSubscribe must be a boolean']),
    ...(isStringArray(type.subscriberRoles) ? [] : ['subscriberRoles must be an array of role names']),
    ...validateChannels(type.channels),
    ...validateEvents(type.events),
  ];

  if (errors.length > 0) {
    throw new InvalidOperationError(`Notification type is invalid: ${errors.join('; ')}.`);
  }
}

/**
 * Returns the notification type with only the fields of a type definition, so other request properties are not
 * saved into the configuration.
 */
export function toNotificationTypeDefinition(type: NotificationType): NotificationType {
  const definition = pick(type, [...DEFINITION_FIELDS, ...OPTIONAL_STRING_FIELDS]) as NotificationType;
  if (Array.isArray(definition.events)) {
    definition.events = definition.events.map((event) => pick(event, ['namespace', 'name', 'templates']));
  }
  return definition;
}
