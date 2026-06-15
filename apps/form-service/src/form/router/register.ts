import { isAllowedUser, ServiceDirectory, TokenProvider, UnauthorizedUserError, adspId } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, createValidationHandler, NotFoundError } from '@core-services/core-common';
import axios from 'axios';
import * as HttpStatusCodes from 'http-status-codes';
import { RequestHandler, Router } from 'express';
import { body, param } from 'express-validator';
import { FormServiceRoles } from '../roles';

const configurationApiId = adspId`urn:ads:platform:configuration-service:v2`;
const DATA_REGISTER_NAMESPACE = 'data-register';

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

      // Fetch the register definition (includes description) from platform/configuration-service
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

      if (!registerDefinition) {
        throw new NotFoundError('data register', name);
      }

      const description = (registerDefinition.description as string) || '';

      // Fetch the actual entries from the data namespace
      const dataResponse = await axios.get(
        new URL(
          `v2/configuration/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/latest`,
          configurationApiUrl,
        ).href,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { tenantId: tenantId?.toString() },
          validateStatus: (status) => status === HttpStatusCodes.OK || status === HttpStatusCodes.NOT_FOUND,
        },
      );

      if (dataResponse.status === HttpStatusCodes.NOT_FOUND) {
        throw new NotFoundError('data register', name);
      }

      const entries = (dataResponse.data?.configuration ?? []) as unknown[];

      res.send({ namespace, name, description, entries });
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

      // Verify the register exists
      const { data: platformData } = await axios.get(
        new URL('v2/configuration/platform/configuration-service/latest', configurationApiUrl).href,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { tenantId: tenantId?.toString() },
        },
      );

      const platformConfig = (platformData?.configuration ?? platformData ?? {}) as Record<string, unknown>;
      const registerKey = `${namespace}:${name}`;
      const existingDefinition = platformConfig[registerKey] as Record<string, unknown> | undefined;

      if (!existingDefinition) {
        throw new NotFoundError('data register', name);
      }

      const { description, entries } = req.body as { description?: string; entries?: unknown[] };

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
        new URL(`v2/configuration/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`, configurationApiUrl)
          .href,
        { operation: 'REPLACE', configuration: entries ?? [] },
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { tenantId: tenantId?.toString() },
        },
      );

      const updatedEntries = (entriesData?.latest?.configuration ?? entries ?? []) as unknown[];
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
        latest?: { configuration?: unknown[] };
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
