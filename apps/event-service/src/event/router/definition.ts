import { AdspId, isAllowedUser, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import {
  assertAuthenticatedHandler,
  ConfigurationClient,
  createValidationHandler,
  InvalidOperationError,
  NotFoundError,
  ValidationService,
} from '@core-services/core-common';
import { RequestHandler, Router } from 'express';
import * as HttpStatusCodes from 'http-status-codes';
import { body, param } from 'express-validator';
import { EventServiceRoles } from '../role';
import type { EventDefinition, Namespace } from '../types';

const NAME_PATTERN = /^[a-zA-Z0-9-_ ]{1,50}$/;
// A single key is reused because the schema is only checked for validity, not kept for validating events.
const SCHEMA_CHECK_KEY = 'event-definition-schema-check';

export type EventConfiguration = Record<string, Namespace>;

interface DefinitionResponse extends EventDefinition {
  namespace: string;
  isCore: boolean;
}

const toDefinitionResponse = (namespace: string, definition: EventDefinition, isCore: boolean): DefinitionResponse => ({
  ...definition,
  namespace,
  isCore,
});

const toDefinitions = (configuration: EventConfiguration, isCore: boolean): DefinitionResponse[] =>
  Object.entries(configuration || {}).flatMap(([namespace, ns]) =>
    Object.values(ns?.definitions || {}).map((definition) => toDefinitionResponse(namespace, definition, isCore)),
  );

const getDefinition = (configuration: EventConfiguration, namespace: string, name: string): EventDefinition =>
  configuration[namespace]?.definitions?.[name];

const getRequiredTenantId = (req: Parameters<RequestHandler>[0]): AdspId => {
  if (!req.tenant?.id) {
    throw new InvalidOperationError('Tenant context is required for operation.');
  }
  return req.tenant.id;
};

const assertUserCanAdminister = (user: User, tenantId: AdspId, operation: string) => {
  if (!isAllowedUser(user, tenantId, EventServiceRoles.admin, true)) {
    throw new UnauthorizedUserError(operation, user);
  }
};

export const assertValidJsonSchema = (
  validationService: ValidationService,
  namespace: string,
  definition: EventDefinition,
): void => {
  try {
    validationService.setSchema(SCHEMA_CHECK_KEY, definition.payloadSchema || {});
  } catch (err) {
    throw new InvalidOperationError(
      `Event definition '${namespace}:${definition.name}' has an invalid JSON schema: ${err.message}`,
    );
  }
};

// The configuration-service UPDATE operation shallow merges each namespace, so the full definitions map is sent.
export const mergeDefinition = (
  configuration: EventConfiguration,
  namespace: string,
  definition: EventDefinition,
): Namespace => ({
  ...configuration[namespace],
  name: namespace,
  definitions: {
    ...configuration[namespace]?.definitions,
    [definition.name]: definition,
  },
});

export const removeDefinition = (configuration: EventConfiguration, namespace: string, name: string): Namespace => {
  const { [name]: _removed, ...definitions } = configuration[namespace]?.definitions || {};
  return { ...configuration[namespace], name: namespace, definitions };
};

// Returns tenant and core event definitions as a flat array; reading requires only an authenticated user.
export function findDefinitions(client: ConfigurationClient<EventConfiguration>): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenantId = req.tenant?.id;

      const [tenant, core] = await Promise.all([
        tenantId ? client.getTenantConfiguration(tenantId) : Promise.resolve({} as EventConfiguration),
        client.getCoreConfiguration(),
      ]);

      res.send([...toDefinitions(tenant, false), ...toDefinitions(core, true)]);
    } catch (err) {
      next(err);
    }
  };
}

// Reads a single tenant or core event definition (edit-load convenience over the list endpoint).
export function findDefinition(client: ConfigurationClient<EventConfiguration>): RequestHandler {
  return async (req, res, next) => {
    try {
      const { namespace, name } = req.params;
      const tenantId = req.tenant?.id;

      const tenant = tenantId ? await client.getTenantConfiguration(tenantId) : ({} as EventConfiguration);
      const tenantDefinition = getDefinition(tenant, namespace, name);
      if (tenantDefinition) {
        res.send(toDefinitionResponse(namespace, tenantDefinition, false));
        return;
      }

      const core = await client.getCoreConfiguration();
      const coreDefinition = getDefinition(core, namespace, name);
      if (!coreDefinition) {
        throw new NotFoundError('event definition', `${namespace}:${name}`);
      }

      res.send(toDefinitionResponse(namespace, coreDefinition, true));
    } catch (err) {
      next(err);
    }
  };
}

// Creates a tenant event definition, merging it into its namespace; core definitions are not writable via this endpoint.
export function createDefinition(
  client: ConfigurationClient<EventConfiguration>,
  validationService: ValidationService,
): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenantId = getRequiredTenantId(req);
      assertUserCanAdminister(req.user, tenantId, 'create event definition');

      const { namespace, ...body } = req.body as Omit<EventDefinition, 'name'> & { namespace: string; name: string };
      const definition: EventDefinition = { ...body };
      assertValidJsonSchema(validationService, namespace, definition);

      const tenant = await client.getTenantConfiguration(tenantId);
      if (getDefinition(tenant, namespace, definition.name)) {
        throw new InvalidOperationError(`Event definition '${namespace}:${definition.name}' already exists.`, {
          statusCode: HttpStatusCodes.CONFLICT,
        });
      }

      const updated = await client.updateEntry(tenantId, namespace, mergeDefinition(tenant, namespace, definition));
      res.send(toDefinitionResponse(namespace, getDefinition(updated, namespace, definition.name), false));
    } catch (err) {
      next(err);
    }
  };
}

// Updates a tenant event definition, merging it into its namespace; core definitions are not writable via this endpoint.
export function updateDefinition(
  client: ConfigurationClient<EventConfiguration>,
  validationService: ValidationService,
): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenantId = getRequiredTenantId(req);
      const { namespace, name } = req.params;
      assertUserCanAdminister(req.user, tenantId, 'update event definition');

      const tenant = await client.getTenantConfiguration(tenantId);
      if (!getDefinition(tenant, namespace, name)) {
        throw new NotFoundError('event definition', `${namespace}:${name}`);
      }

      const definition: EventDefinition = { ...(req.body as Omit<EventDefinition, 'name'>), name };
      assertValidJsonSchema(validationService, namespace, definition);

      const updated = await client.updateEntry(tenantId, namespace, mergeDefinition(tenant, namespace, definition));
      res.send(toDefinitionResponse(namespace, getDefinition(updated, namespace, name), false));
    } catch (err) {
      next(err);
    }
  };
}

export function deleteDefinition(client: ConfigurationClient<EventConfiguration>): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenantId = getRequiredTenantId(req);
      const { namespace, name } = req.params;
      assertUserCanAdminister(req.user, tenantId, 'delete event definition');

      const tenant = await client.getTenantConfiguration(tenantId);
      if (!getDefinition(tenant, namespace, name)) {
        throw new NotFoundError('event definition', `${namespace}:${name}`);
      }

      const remaining = removeDefinition(tenant, namespace, name);
      if (Object.keys(remaining.definitions).length === 0) {
        await client.deleteEntry(tenantId, namespace);
      } else {
        await client.updateEntry(tenantId, namespace, remaining);
      }

      res.send({ deleted: true });
    } catch (err) {
      next(err);
    }
  };
}

interface DefinitionRouterProps {
  client: ConfigurationClient<EventConfiguration>;
  validationService: ValidationService;
}

const validateDefinitionBody = () => [
  body('description').optional({ nullable: true }).isString(),
  body('payloadSchema').isObject(),
  body('interval').optional({ nullable: true }).isObject(),
  body('log').optional({ nullable: true }).isObject(),
];

const validateCreateDefinitionBody = () => [
  body('namespace').isString().matches(NAME_PATTERN),
  body('name').isString().matches(NAME_PATTERN),
  ...validateDefinitionBody(),
];

export const createDefinitionRouter = ({ client, validationService }: DefinitionRouterProps): Router => {
  const router = Router();

  const validateNamespaceNameParams = createValidationHandler(
    param('namespace').isString().matches(NAME_PATTERN),
    param('name').isString().matches(NAME_PATTERN),
  );

  router.get('/definitions', assertAuthenticatedHandler, findDefinitions(client));
  router.get(
    '/definitions/:namespace/:name',
    assertAuthenticatedHandler,
    validateNamespaceNameParams,
    findDefinition(client),
  );
  router.post(
    '/definitions',
    assertAuthenticatedHandler,
    createValidationHandler(...validateCreateDefinitionBody()),
    createDefinition(client, validationService),
  );
  router.patch(
    '/definitions/:namespace/:name',
    assertAuthenticatedHandler,
    validateNamespaceNameParams,
    createValidationHandler(...validateDefinitionBody()),
    updateDefinition(client, validationService),
  );
  router.delete(
    '/definitions/:namespace/:name',
    assertAuthenticatedHandler,
    validateNamespaceNameParams,
    deleteDefinition(client),
  );

  return router;
};
