import { isAllowedUser, ServiceDirectory, TokenProvider, UnauthorizedUserError, adspId } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, createValidationHandler, NotFoundError } from '@core-services/core-common';
import axios from 'axios';
import * as HttpStatusCodes from 'http-status-codes';
import { RequestHandler, Router } from 'express';
import { body, param } from 'express-validator';
import { FormServiceRoles } from '../roles';
import {
  DataRegisterDefinition,
  DataRegisterEntry,
  DataRegisterCreateRequest,
  DataRegisterUpdateRequest,
  ConfigurationPatchResponse,
  DataRegisterResponse,
  ConfigurationUpdateOperation,
  ConfigurationReplaceOperation,
} from './types';

const configurationApiId = adspId`urn:ads:platform:configuration-service:v2`;
const DATA_REGISTER_NAMESPACE = 'data-register';

const getDataRegisterResourcePath = (name: string, namespace = DATA_REGISTER_NAMESPACE): string =>
  `v2/configuration/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`;

const assertRegisterExists = (status: number, name: string): void => {
  if (status === HttpStatusCodes.NOT_FOUND) {
    throw new NotFoundError('data register', name);
  }
};

export function getRegister(directory: ServiceDirectory, tokenProvider: TokenProvider): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant?.id;
      const { name } = req.params;
      const namespace = DATA_REGISTER_NAMESPACE;

      if (!isAllowedUser(user, tenantId, FormServiceRoles.Admin)) {
        throw new UnauthorizedUserError('get register', user);
      }

      const configurationApiUrl = await directory.getServiceUrl(configurationApiId);
      const token = await tokenProvider.getAccessToken();

      // Fetch the actual entries — this is the source of truth for existence
      const dataResponse = await axios.get(
        new URL(getDataRegisterResourcePath(name, namespace), configurationApiUrl).href,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { tenantId: tenantId?.toString() },
          validateStatus: (status) => status === HttpStatusCodes.OK || status === HttpStatusCodes.NOT_FOUND,
        },
      );

      assertRegisterExists(dataResponse.status, name);

      const entries = (dataResponse.data?.latest?.configuration ?? []) as DataRegisterEntry[];

      const { data: platformData } = await axios.get(
        new URL('v2/configuration/platform/configuration-service/latest', configurationApiUrl).href,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { tenantId: tenantId?.toString() },
        },
      );

      const platformConfig = (platformData?.configuration ?? platformData ?? {}) as Record<string, unknown>;
      const registerKey = `${namespace}:${name}`;
      const registerDefinition = platformConfig[registerKey] as Record<string, unknown> | undefined;
      const description = (registerDefinition?.description as string) || '';

      res.send({ namespace, name, description, entries });
    } catch (err) {
      next(err);
    }
  };
}

const dataRegisterConfigurationSchema = {
  type: 'array',
  items: {
    anyOf: [{ type: 'string' }, { type: 'object' }],
  },
};

const getDataRegisterDefinitionKey = (name: string, namespace = defaultDataRegisterNamespace): string =>
  `${namespace}:${name}`;

const createDataRegisterDefinitionPatch = (
  name: string,
  description: string,
  namespace = defaultDataRegisterNamespace,
): ConfigurationUpdateOperation<DataRegisterDefinition> => ({
  operation: 'UPDATE',
  update: {
    [getDataRegisterDefinitionKey(name, namespace)]: {
      configurationSchema: dataRegisterConfigurationSchema,
      description,
    },
  },
});

const createDataRegisterConfigurationPatch = (entries: DataRegisterEntry[]): ConfigurationReplaceOperation<DataRegisterEntry[]> => ({
  operation: 'REPLACE',
  configuration: entries,
});

const mapDataRegisterResponse = (
  name: string,
  description: string,
  entries: DataRegisterEntry[],
  namespace = defaultDataRegisterNamespace,
): DataRegisterResponse => ({
  namespace,
  name,
  description,
  entries,
});

const patchConfigurationResource = async <T>(
  configurationApiUrl: URL,
  token: string,
  tenantId: string,
  resourcePath: string,
  sendData: ConfigurationUpdateOperation<DataRegisterDefinition> | ConfigurationReplaceOperation<DataRegisterEntry[]>,
): Promise<ConfigurationPatchResponse<T>> => {
  const { data } = await axios.patch<ConfigurationPatchResponse<T>>(
    new URL(resourcePath, configurationApiUrl).href,

    sendData,
    {
      headers: { Authorization: `Bearer ${token}` },
      params: { tenantId },
    },
  );

  return data;
};

const defaultDataRegisterNamespace = 'data-register';

export function createDataRegister(directory: ServiceDirectory, tokenProvider: TokenProvider): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant.id;

      if (!isAllowedUser(user, tenantId, FormServiceRoles.Admin, true)) {
        throw new UnauthorizedUserError('create data register', user);
      }

      const {
        namespace = defaultDataRegisterNamespace,
        name,
        description = '',
        entries = [],
      } = req.body as DataRegisterCreateRequest;
      const tenantIdValue = tenantId?.toString();
      const configurationApiUrl = await directory.getServiceUrl(configurationApiId);
      const token = await tokenProvider.getAccessToken();
      const definitionPatch = createDataRegisterDefinitionPatch(name, description, namespace);

      await patchConfigurationResource<string[]>(
        configurationApiUrl,
        token,
        tenantIdValue,
        `v2/configuration/platform/configuration-service`,
        definitionPatch,
      );

      const configurationPatch = createDataRegisterConfigurationPatch(entries);

      const registerConfigurationResponse = await patchConfigurationResource<DataRegisterEntry[]>(
        configurationApiUrl,
        token,
        tenantIdValue,
        getDataRegisterResourcePath(name, namespace),
        configurationPatch,
      );

      const response = mapDataRegisterResponse(
        name,
        description,
        registerConfigurationResponse.latest.configuration,
        namespace,
      );

      res.status(HttpStatusCodes.CREATED).send(response);
    } catch (err) {
      next(err);
    }
  };
}

export function updateRegister(directory: ServiceDirectory, tokenProvider: TokenProvider): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant?.id;
      const { name } = req.params;
      const namespace = DATA_REGISTER_NAMESPACE;

      if (!isAllowedUser(user, tenantId, FormServiceRoles.Admin, true)) {
        throw new UnauthorizedUserError('update register', user);
      }

      const configurationApiUrl = await directory.getServiceUrl(configurationApiId);
      const token = await tokenProvider.getAccessToken();

      // Verify the register exists before updating
      const existsCheck = await axios.get(
        new URL(`v2/configuration/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`, configurationApiUrl)
          .href,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { tenantId: tenantId?.toString() },
          validateStatus: (status) => status === HttpStatusCodes.OK || status === HttpStatusCodes.NOT_FOUND,
        },
      );

      if (existsCheck.status === HttpStatusCodes.NOT_FOUND) {
        throw new NotFoundError('data register', name);
      }

      // Fetch platform config for current description
      const { data: platformData } = await axios.get(
        new URL('v2/configuration/platform/configuration-service/latest', configurationApiUrl).href,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { tenantId: tenantId?.toString() },
        },
      );

      const platformConfig = (platformData?.configuration ?? platformData ?? {}) as Record<string, unknown>;
      const registerKey = `${namespace}:${name}`;
      const existingDefinition = (platformConfig[registerKey] as Record<string, unknown>) ?? {};

      const { description, entries } = req.body as DataRegisterUpdateRequest;

      // Update description in the platform/configuration-service definition if provided
      if (description !== undefined) {
        await axios.patch(
          new URL('v2/configuration/platform/configuration-service', configurationApiUrl).href,
          {
            operation: 'UPDATE',
            update: {
              [registerKey]: { ...existingDefinition, description },
            },
          },
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { tenantId: tenantId?.toString() },
          },
        );
      }

      // Replace the entries data
      const { data: entriesData } = await axios.patch(
        new URL(getDataRegisterResourcePath(name, namespace), configurationApiUrl).href,
        { operation: 'REPLACE', configuration: entries ?? [] },
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { tenantId: tenantId?.toString() },
        },
      );

      const updatedEntries = (entriesData?.latest?.configuration ?? entries ?? []) as DataRegisterEntry[];
      const updatedDescription =
        description !== undefined ? description : (existingDefinition.description as string) || '';

      res.send({ namespace, name, description: updatedDescription, entries: updatedEntries });
    } catch (err) {
      next(err);
    }
  };
}

export function findDataRegisters(directory: ServiceDirectory, tokenProvider: TokenProvider): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenantId = req.tenant?.id;

      const configurationApiUrl = await directory.getServiceUrl(configurationApiId);
      const token = await tokenProvider.getAccessToken();

      // Fetch register definitions (descriptions) from platform/configuration-service
      const { data: platformData } = await axios.get(
        new URL('v2/configuration/platform/configuration-service/latest', configurationApiUrl).href,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { tenantId: tenantId?.toString() },
        },
      );

      const platformConfig = (platformData?.configuration ?? platformData ?? {}) as Record<string, unknown>;

      // Fetch all entries across the data-register namespace
      const { data: registersData } = await axios.get(
        new URL(`v2/configuration/${DATA_REGISTER_NAMESPACE}`, configurationApiUrl).href,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { tenantId: tenantId?.toString() },
          validateStatus: (status) => status === HttpStatusCodes.OK || status === HttpStatusCodes.NOT_FOUND,
        },
      );

      const results = (registersData?.results ?? []) as {
        name: string;
        namespace: string;
        latest?: { configuration?: DataRegisterEntry[] };
      }[];

      const registers = results.map((result) => {
        const definitionKey = `${result.namespace}:${result.name}`;
        const definition = platformConfig[definitionKey] as Record<string, unknown> | undefined;

        return {
          name: result.name,
          namespace: result.namespace,
          description: (definition?.description as string) ?? '',
          entries: result.latest?.configuration ?? [],
        };
      });

      res.send(registers);
    } catch (err) {
      next(err);
    }
  };
}

interface RegisterRouterProps {
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
}

export function createRegisterRouter({ directory, tokenProvider }: RegisterRouterProps): Router {
  const router = Router();

  router.get('/registers', assertAuthenticatedHandler, findDataRegisters(directory, tokenProvider));

  router.get(
    '/registers/:name',
    assertAuthenticatedHandler,
    createValidationHandler(
      param('name')
        .isString()
        .isLength({ min: 1, max: 100 })
        .matches(/^[a-zA-Z0-9-_]+$/),
    ),
    getRegister(directory, tokenProvider),
  );

  router.post(
    '/registers',
    assertAuthenticatedHandler,
    createValidationHandler(
      body().isObject(),
      body('name')
        .exists()
        .withMessage('name is required')
        .bail()
        .isString()
        .isLength({ min: 1, max: 50 })
        .matches(/^[a-zA-Z0-9-]+$/),
      body('namespace')
        .optional()
        .isString()
        .isLength({ min: 1, max: 50 })
        .matches(/^[a-zA-Z0-9-]+$/),
      body('description').optional().isString(),
      body('entries').optional().isArray(),
    ),
    createDataRegister(directory, tokenProvider),
  );

  router.patch(
    '/registers/:name',
    assertAuthenticatedHandler,
    createValidationHandler(
      param('name')
        .isString()
        .isLength({ min: 1, max: 100 })
        .matches(/^[a-zA-Z0-9-_]+$/),
      body('description').optional().isString(),
      body('entries').optional().isArray(),
    ),
    updateRegister(directory, tokenProvider),
  );

  return router;
}
