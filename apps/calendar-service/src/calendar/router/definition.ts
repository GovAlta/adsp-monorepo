import {
  adspId,
  AdspId,
  ConfigurationService,
  EventService,
  isAllowedUser,
  ServiceDirectory,
  TokenProvider,
  UnauthorizedUserError,
} from '@abgov/adsp-service-sdk';
import {
  assertAuthenticatedHandler,
  createValidationHandler,
  InvalidOperationError,
  NotFoundError,
} from '@core-services/core-common';
import axios from 'axios';
import { RequestHandler, Router } from 'express';
import { body, param } from 'express-validator';
import * as HttpStatusCodes from 'http-status-codes';
import { calendarNamePattern } from '../configuration';
import {
  calendarDefinitionCreated,
  calendarDefinitionDeleted,
  calendarDefinitionUpdated,
} from '../events';
import { CalendarEntity } from '../model';
import { CalendarRepository } from '../repository';
import { CalendarServiceRoles } from '../roles';
import { Calendar, CalendarDefinition, CalendarDefinitionsConfiguration } from '../types';
import { mapCalendar } from './mapper';

const configurationApiId = adspId`urn:ads:platform:configuration-service:v2`;
const configurationPath = 'v2/configuration/platform/calendar-service';
const definitionProperties = ['name', 'displayName', 'description', 'readRoles', 'updateRoles'];

interface CalendarConfigurationClient {
  apiUrl: URL;
  token: string;
}

interface CalendarDefinitionRouterProps {
  apiId: AdspId;
  serviceId: AdspId;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  configurationService: ConfigurationService;
  eventService: EventService;
  repository: CalendarRepository;
}

type CalendarConfigurationPatch =
  | { operation: 'UPDATE'; update: CalendarDefinitionsConfiguration }
  | { operation: 'DELETE'; property: string };

async function getConfigurationClient(directory: ServiceDirectory, tokenProvider: TokenProvider) {
  const [apiUrl, token] = await Promise.all([
    directory.getServiceUrl(configurationApiId),
    tokenProvider.getAccessToken(),
  ]);
  return { apiUrl, token };
}

async function fetchCalendarDefinitions(
  { apiUrl, token }: CalendarConfigurationClient,
  tenantId?: AdspId
): Promise<CalendarDefinitionsConfiguration> {
  const { data } = await axios.get<CalendarDefinitionsConfiguration>(
    new URL(`${configurationPath}/latest`, apiUrl).href,
    {
      headers: { Authorization: `Bearer ${token}` },
      params: tenantId ? { tenantId: tenantId.toString() } : undefined,
    }
  );
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new InvalidOperationError('Configuration service returned invalid calendar definitions.', {
      statusCode: HttpStatusCodes.BAD_GATEWAY,
    });
  }
  return data;
}

async function patchCalendarDefinitions(
  { apiUrl, token }: CalendarConfigurationClient,
  tenantId: AdspId,
  patch: CalendarConfigurationPatch
): Promise<void> {
  await axios.patch(new URL(configurationPath, apiUrl).href, patch, {
    headers: { Authorization: `Bearer ${token}` },
    params: { tenantId: tenantId.toString() },
  });
}

function asConfigurationError(error: unknown): unknown {
  if (!axios.isAxiosError(error)) {
    return error;
  }
  if (!error.response) {
    return new InvalidOperationError('Configuration service is unavailable.', {
      statusCode: HttpStatusCodes.BAD_GATEWAY,
    });
  }

  const { status, data } = error.response;
  const statusCode =
    status >= 500 || status === HttpStatusCodes.UNAUTHORIZED || status === HttpStatusCodes.FORBIDDEN
      ? HttpStatusCodes.BAD_GATEWAY
      : status;
  const message =
    statusCode === HttpStatusCodes.BAD_GATEWAY
      ? 'Configuration service request failed.'
      : typeof data?.errorMessage === 'string'
        ? data.errorMessage
        : 'Configuration service rejected the request.';

  return new InvalidOperationError(message, { statusCode });
}

function toDefinition({ name, displayName, description, readRoles, updateRoles }: CalendarDefinition): Calendar {
  return { name, displayName, description: description ?? '', readRoles, updateRoles };
}

function clearTenantCalendarCache(
  configurationService: ConfigurationService,
  serviceId: AdspId,
  tenantId: AdspId
): void {
  configurationService.clearCached?.(tenantId, serviceId.namespace, serviceId.service);
}

async function requireTenantDefinition(
  client: CalendarConfigurationClient,
  tenantId: AdspId,
  name: string
): Promise<CalendarDefinition> {
  const definitions = await fetchCalendarDefinitions(client, tenantId);
  if (!Object.hasOwn(definitions, name)) {
    throw new NotFoundError('Calendar', name);
  }
  return definitions[name];
}

const requireCalendarAdmin: RequestHandler = (req, _res, next) => {
  try {
    if (!isAllowedUser(req.user, req.tenant?.id, CalendarServiceRoles.Admin, true)) {
      throw new UnauthorizedUserError('manage calendar definitions', req.user);
    }
    if (!req.tenant?.id) {
      throw new InvalidOperationError('Tenant context is required.');
    }
    next();
  } catch (err) {
    next(err);
  }
};

const validateDefinitionBody = createValidationHandler(
  body('name').isString().matches(calendarNamePattern).not().equals('__proto__'),
  body('displayName')
    .isString()
    .isLength({ min: 1, max: 32 })
    .custom((value: string) => typeof value === 'string' && value.trim().length > 0),
  body('description').optional().isString().isLength({ max: 250 }),
  body('readRoles').isArray(),
  body('readRoles.*').isString(),
  body('updateRoles').isArray(),
  body('updateRoles.*').isString(),
  body().custom((value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('Calendar definition must be an object.');
    }
    const unexpected = Object.keys(value).filter((property) => !definitionProperties.includes(property));
    if (unexpected.length) {
      throw new Error(`Unsupported properties: ${unexpected.join(', ')}`);
    }
    return true;
  })
);

const validateDefinitionName = createValidationHandler(
  param('name').isString().matches(calendarNamePattern).not().equals('__proto__')
);
const validateMatchingName = createValidationHandler(
  body('name').custom((name, { req }) => name === req.params.name)
);

export function getCalendars(apiId: AdspId, directory: ServiceDirectory, tokenProvider: TokenProvider): RequestHandler {
  return async (req, res, next) => {
    try {
      const client = await getConfigurationClient(directory, tokenProvider);
      const tenantId = req.tenant?.id || req.user?.tenantId;
      const [core, tenant] = await Promise.all([
        fetchCalendarDefinitions(client),
        tenantId ? fetchCalendarDefinitions(client, tenantId) : Promise.resolve<CalendarDefinitionsConfiguration>({}),
      ]);

      res.send([
        ...Object.values(tenant).map((definition) => mapCalendar(apiId, definition, 'tenant')),
        ...Object.values(core).map((definition) => mapCalendar(apiId, definition, 'core')),
      ]);
    } catch (err) {
      next(asConfigurationError(err));
    }
  };
}

function createCalendarDefinition(props: CalendarDefinitionRouterProps): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenantId = req.tenant.id;
      const definition = toDefinition(req.body);
      const client = await getConfigurationClient(props.directory, props.tokenProvider);
      const [tenant, core] = await Promise.all([
        fetchCalendarDefinitions(client, tenantId),
        fetchCalendarDefinitions(client),
      ]);
      if (Object.hasOwn(tenant, definition.name) || Object.hasOwn(core, definition.name)) {
        throw new InvalidOperationError(`Calendar '${definition.name}' already exists.`, {
          statusCode: HttpStatusCodes.CONFLICT,
        });
      }

      await patchCalendarDefinitions(client, tenantId, {
        operation: 'UPDATE',
        update: { [definition.name]: definition },
      });
      clearTenantCalendarCache(props.configurationService, props.serviceId, tenantId);
      props.eventService.send(calendarDefinitionCreated(req.user, tenantId, definition));
      res.status(HttpStatusCodes.CREATED).send(mapCalendar(props.apiId, definition, 'tenant'));
    } catch (err) {
      next(asConfigurationError(err));
    }
  };
}

function updateCalendarDefinition(props: CalendarDefinitionRouterProps): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenantId = req.tenant.id;
      const { name } = req.params;
      const definition = toDefinition(req.body);
      const client = await getConfigurationClient(props.directory, props.tokenProvider);
      await requireTenantDefinition(client, tenantId, name);
      await patchCalendarDefinitions(client, tenantId, {
        operation: 'UPDATE',
        update: { [name]: definition },
      });
      clearTenantCalendarCache(props.configurationService, props.serviceId, tenantId);
      props.eventService.send(calendarDefinitionUpdated(req.user, tenantId, definition));
      res.status(HttpStatusCodes.OK).send(mapCalendar(props.apiId, definition, 'tenant'));
    } catch (err) {
      next(asConfigurationError(err));
    }
  };
}

function deleteCalendarDefinition(props: CalendarDefinitionRouterProps): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenantId = req.tenant.id;
      const { name } = req.params;
      const client = await getConfigurationClient(props.directory, props.tokenProvider);
      const definition = await requireTenantDefinition(client, tenantId, name);
      const calendar = new CalendarEntity(props.repository, tenantId, toDefinition(definition));
      const { results } = await props.repository.getCalendarEvents(calendar, 1);
      if (results.length) {
        throw new InvalidOperationError(`Calendar '${name}' contains events and cannot be deleted.`, {
          statusCode: HttpStatusCodes.CONFLICT,
        });
      }

      await patchCalendarDefinitions(client, tenantId, { operation: 'DELETE', property: name });
      clearTenantCalendarCache(props.configurationService, props.serviceId, tenantId);
      props.eventService.send(calendarDefinitionDeleted(req.user, tenantId, definition));
      res.status(HttpStatusCodes.NO_CONTENT).send();
    } catch (err) {
      next(asConfigurationError(err));
    }
  };
}

export function registerCalendarDefinitionRoutes(router: Router, props: CalendarDefinitionRouterProps): void {
  router.get('/calendars', getCalendars(props.apiId, props.directory, props.tokenProvider));
  router.post(
    '/calendars',
    assertAuthenticatedHandler,
    requireCalendarAdmin,
    validateDefinitionBody,
    createCalendarDefinition(props)
  );
  router.put(
    '/calendars/:name',
    assertAuthenticatedHandler,
    requireCalendarAdmin,
    validateDefinitionName,
    validateDefinitionBody,
    validateMatchingName,
    updateCalendarDefinition(props)
  );
  router.delete(
    '/calendars/:name',
    assertAuthenticatedHandler,
    requireCalendarAdmin,
    validateDefinitionName,
    deleteCalendarDefinition(props)
  );
}
