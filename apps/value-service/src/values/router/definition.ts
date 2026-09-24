import { AdspId, isAllowedUser, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import {
  createValidationHandler,
  InvalidOperationError,
  NotFoundError,
  ValidationService,
} from '@core-services/core-common';
import { RequestHandler, Router } from 'express';
import { body, param } from 'express-validator';
import * as HttpStatusCodes from 'http-status-codes';
import { DefinitionConfigurationClient, ValueConfiguration } from '../definitionClient';
import { ServiceUserRoles } from '../types';
import type { Namespace } from '../types';

const NAME_PATTERN = /^[a-zA-Z0-9-_ ]{1,50}$/;
// A single key is reused because the schema is only checked for validity, not kept for validating values.
const SCHEMA_CHECK_KEY = 'value-definition-schema-check';

// Matches the definition properties allowed by the value-service configuration schema.
interface StoredDefinition {
  name: string;
  displayName?: string;
  description: string;
  jsonSchema: Record<string, unknown>;
  sendWriteEvent?: boolean;
}

type DefinitionUpdate = Partial<Omit<StoredDefinition, 'name'>>;

interface DefinitionResponse extends StoredDefinition {
  namespace: string;
  isCore: boolean;
}

const toStoredDefinition = (definition: StoredDefinition): StoredDefinition => {
  const { name, displayName, description, jsonSchema, sendWriteEvent } = definition;
  return {
    name,
    description: description ?? '',
    jsonSchema,
    ...(displayName !== undefined && { displayName }),
    ...(sendWriteEvent !== undefined && { sendWriteEvent }),
  };
};

const toDefinitionResponse = (
  namespace: string,
  definition: StoredDefinition,
  isCore: boolean,
): DefinitionResponse => ({
  ...toStoredDefinition(definition),
  namespace,
  isCore,
});

const findDefinition = (configuration: ValueConfiguration, namespace: string, name: string): StoredDefinition =>
  configuration[namespace]?.definitions?.[name] as StoredDefinition;

const getRequiredTenantId = (req: Parameters<RequestHandler>[0]): AdspId => {
  if (!req.tenant?.id) {
    throw new InvalidOperationError('Tenant context is required for operation.');
  }
  return req.tenant.id;
};

const assertUserCanRead = (user: User, tenantId: AdspId, operation: string) => {
  if (!isAllowedUser(user, tenantId, [ServiceUserRoles.Writer, ServiceUserRoles.Reader], true)) {
    throw new UnauthorizedUserError(operation, user);
  }
};

const assertUserCanAdminister = (user: User, tenantId: AdspId, operation: string) => {
  if (!isAllowedUser(user, tenantId, ServiceUserRoles.Writer, true)) {
    throw new UnauthorizedUserError(operation, user);
  }
};

export const assertValidJsonSchema = (
  validationService: ValidationService,
  namespace: string,
  definition: StoredDefinition,
): void => {
  try {
    validationService.setSchema(SCHEMA_CHECK_KEY, definition.jsonSchema);
  } catch (err) {
    throw new InvalidOperationError(
      `Value definition '${namespace}:${definition.name}' has an invalid JSON schema: ${err.message}`,
    );
  }
};

// The configuration-service UPDATE operation shallow merges each namespace, so the full definitions map is sent.
export const mergeDefinition = (
  configuration: ValueConfiguration,
  namespace: string,
  definition: StoredDefinition,
): Namespace => ({
  ...configuration[namespace],
  name: namespace,
  definitions: {
    ...configuration[namespace]?.definitions,
    [definition.name]: toStoredDefinition(definition),
  },
});

export const removeDefinition = (configuration: ValueConfiguration, namespace: string, name: string): Namespace => {
  const { [name]: _removed, ...definitions } = configuration[namespace]?.definitions || {};
  return { ...configuration[namespace], name: namespace, definitions };
};

export function findDefinitions(client: DefinitionConfigurationClient): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenantId = req.tenant?.id;
      assertUserCanRead(req.user, tenantId, 'find value definitions');

      const [tenant, core] = await Promise.all([
        tenantId ? client.getTenantConfiguration(tenantId) : Promise.resolve({}),
        client.getCoreConfiguration(),
      ]);

      res.send({ tenant, core });
    } catch (err) {
      next(err);
    }
  };
}

export function getDefinition(client: DefinitionConfigurationClient): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenantId = req.tenant?.id;
      const { namespace, name } = req.params;
      assertUserCanRead(req.user, tenantId, 'get value definition');

      const tenantDefinition =
        tenantId && findDefinition(await client.getTenantConfiguration(tenantId), namespace, name);
      if (tenantDefinition) {
        res.send(toDefinitionResponse(namespace, tenantDefinition, false));
        return;
      }

      const coreDefinition = findDefinition(await client.getCoreConfiguration(), namespace, name);
      if (!coreDefinition) {
        throw new NotFoundError('value definition', `${namespace}:${name}`);
      }
      res.send(toDefinitionResponse(namespace, coreDefinition, true));
    } catch (err) {
      next(err);
    }
  };
}

export function createDefinition(
  client: DefinitionConfigurationClient,
  validationService: ValidationService,
): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenantId = getRequiredTenantId(req);
      assertUserCanAdminister(req.user, tenantId, 'create value definition');

      const { namespace, ...definition } = req.body as StoredDefinition & { namespace: string };
      assertValidJsonSchema(validationService, namespace, definition);

      const [tenant, core] = await Promise.all([
        client.getTenantConfiguration(tenantId),
        client.getCoreConfiguration(),
      ]);
      if (findDefinition(tenant, namespace, definition.name) || findDefinition(core, namespace, definition.name)) {
        throw new InvalidOperationError(`Value definition '${namespace}:${definition.name}' already exists.`, {
          statusCode: HttpStatusCodes.CONFLICT,
        });
      }

      const updated = await client.updateNamespace(tenantId, mergeDefinition(tenant, namespace, definition));
      res
        .status(HttpStatusCodes.CREATED)
        .send(toDefinitionResponse(namespace, findDefinition(updated, namespace, definition.name), false));
    } catch (err) {
      next(err);
    }
  };
}

export function updateDefinition(
  client: DefinitionConfigurationClient,
  validationService: ValidationService,
): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenantId = getRequiredTenantId(req);
      const { namespace, name } = req.params;
      assertUserCanAdminister(req.user, tenantId, 'update value definition');

      const tenant = await client.getTenantConfiguration(tenantId);
      const existing = findDefinition(tenant, namespace, name);
      if (!existing) {
        throw new NotFoundError('value definition', `${namespace}:${name}`);
      }

      const definition: StoredDefinition = { ...existing, ...(req.body as DefinitionUpdate), name };
      assertValidJsonSchema(validationService, namespace, definition);

      const updated = await client.updateNamespace(tenantId, mergeDefinition(tenant, namespace, definition));
      res.send(toDefinitionResponse(namespace, findDefinition(updated, namespace, name), false));
    } catch (err) {
      next(err);
    }
  };
}

export function deleteDefinition(client: DefinitionConfigurationClient): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenantId = getRequiredTenantId(req);
      const { namespace, name } = req.params;
      assertUserCanAdminister(req.user, tenantId, 'delete value definition');

      const tenant = await client.getTenantConfiguration(tenantId);
      if (!findDefinition(tenant, namespace, name)) {
        throw new NotFoundError('value definition', `${namespace}:${name}`);
      }

      const remaining = removeDefinition(tenant, namespace, name);
      if (Object.keys(remaining.definitions).length === 0) {
        await client.deleteNamespace(tenantId, namespace);
      } else {
        await client.updateNamespace(tenantId, remaining);
      }

      res.send({ deleted: true });
    } catch (err) {
      next(err);
    }
  };
}

interface DefinitionRouterProps {
  client: DefinitionConfigurationClient;
  validationService: ValidationService;
}

const validateDefinitionBody = (optional: boolean) => [
  body('description').optional().isString(),
  body('displayName').optional().isString(),
  optional ? body('jsonSchema').optional().isObject() : body('jsonSchema').isObject(),
  body('sendWriteEvent').optional().isBoolean(),
];

export const createDefinitionRouter = ({ client, validationService }: DefinitionRouterProps): Router => {
  const router = Router();

  const validateNamespaceNameParams = createValidationHandler(
    param('namespace').isString().matches(NAME_PATTERN),
    param('name').isString().matches(NAME_PATTERN),
  );

  router.get('/definitions', findDefinitions(client));
  router.get('/definitions/:namespace/:name', validateNamespaceNameParams, getDefinition(client));
  router.post(
    '/definitions',
    createValidationHandler(
      body('namespace').isString().matches(NAME_PATTERN),
      body('name').isString().matches(NAME_PATTERN),
      ...validateDefinitionBody(false),
    ),
    createDefinition(client, validationService),
  );
  router.patch(
    '/definitions/:namespace/:name',
    validateNamespaceNameParams,
    createValidationHandler(...validateDefinitionBody(true)),
    updateDefinition(client, validationService),
  );
  router.delete('/definitions/:namespace/:name', validateNamespaceNameParams, deleteDefinition(client));

  return router;
};
