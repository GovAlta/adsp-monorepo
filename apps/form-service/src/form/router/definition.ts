import {
  AdspId,
  isAllowedUser,
  TenantService,
  TokenProvider,
  ServiceDirectory,
  UnauthorizedUserError,
  adspId,
} from '@abgov/adsp-service-sdk';
import {
  assertAuthenticatedHandler,
  createValidationHandler,
  InvalidOperationError,
  NotFoundError,
  Results,
} from '@core-services/core-common';
import axios from 'axios';
import * as HttpStatusCodes from 'http-status-codes';
import { RequestHandler, Router } from 'express';
import { body, param } from 'express-validator';
import { FormDefinitionEntity } from '../model';
import { mapFormDefinition } from '../mapper';
import { FormServiceRoles } from '../roles';
import { FormDefinition, Intake } from '../types';
import { CalendarService } from '../calendar';

const configurationApiId = adspId`urn:ads:platform:configuration-service:v2`;

export function getFormDefinitions(directory: ServiceDirectory, tokenProvider: TokenProvider): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant?.id;
      const { top: topValue, after } = req.query;
      const top = topValue ? parseInt(topValue as string) : 20;

      if (!isAllowedUser(user, tenantId, FormServiceRoles.Admin)) {
        throw new UnauthorizedUserError('access definitions', user);
      }

      const configurationApiUrl = await directory.getServiceUrl(configurationApiId);
      const token = await tokenProvider.getAccessToken();
      const { data } = await axios.get<
        Results<{
          latest: { revision: number; configuration: FormDefinition };
          active: { revision: number; configuration: FormDefinition };
        }>
      >(new URL('v2/configuration/form-service', configurationApiUrl).href, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          top,
          after,
          tenantId: tenantId?.toString(),
          includeActive: true,
        },
      });

      res.send({
        ...data,
        results: data.results.map(({ latest, active }) =>
          active
            ? mapFormDefinition(active.configuration, active.revision)
            : mapFormDefinition(latest.configuration, latest.revision),
        ),
      });
    } catch (err) {
      next(err);
    }
  };
}

export function getFormDefinition(tenantService: TenantService, calendarService: CalendarService): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const { definitionId } = req.params;

      // This endpoint allows anonymous requests and needs to support resolving tenant context via a query param in that case.
      if (!req.tenant) {
        const { tenantId: tenantIdValue } = req.query;
        const tenantId = tenantIdValue ? AdspId.parse(tenantIdValue as string) : null;
        req.tenant = tenantId ? await tenantService.getTenant(tenantId) : null;
      }

      if (!req.tenant) {
        throw new InvalidOperationError('Cannot determine tenant context of request.');
      }

      const { version } = req.query;

      let definition: FormDefinitionEntity;

      if (version) {
        [definition] = await req.getServiceConfigurationRevision<FormDefinitionEntity>(
          version as string,
          definitionId,
          req.tenant.id,
        );
      } else {
        [definition] = await req.getServiceConfiguration<FormDefinitionEntity>(definitionId, req.tenant.id);
      }

      if (!definition) {
        throw new NotFoundError('form definition', definitionId);
      }

      if (!definition.canAccessDefinition(user)) {
        throw new UnauthorizedUserError('access definition', user);
      }

      let intake: Intake;
      if (definition.scheduledIntakes) {
        intake = await calendarService.getScheduledIntake(definition);
      }

      res.send(mapFormDefinition(definition, definition.revision, intake));
    } catch (err) {
      next(err);
    }
  };
}

export function createFormDefinition(directory: ServiceDirectory, tokenProvider: TokenProvider): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant?.id;

      if (!isAllowedUser(user, tenantId, FormServiceRoles.Admin, true)) {
        throw new UnauthorizedUserError('create form definition', user);
      }

      const definition: FormDefinition = req.body;

      const configurationApiUrl = await directory.getServiceUrl(configurationApiId);
      const token = await tokenProvider.getAccessToken();

      // Check if definition already exists — return 409 if so.
      const existingDefinitionResponse = await axios.get<{ latest?: { configuration: FormDefinition } }>(
        new URL(`v2/configuration/form-service/${definition.id}/latest`, configurationApiUrl).href,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { tenantId: tenantId?.toString() },
          validateStatus: (status) => status === HttpStatusCodes.OK || status === HttpStatusCodes.NOT_FOUND,
        },
      );
      if (
        existingDefinitionResponse.status === HttpStatusCodes.OK &&
        existingDefinitionResponse.data?.latest?.configuration
      ) {
        throw new InvalidOperationError(`Form definition with ID '${definition.id}' already exists.`, {
          statusCode: HttpStatusCodes.CONFLICT,
        });
      }

      const { data } = await axios.patch<{ latest: { revision: number; configuration: FormDefinition } }>(
        new URL(`v2/configuration/form-service/${definition.id}`, configurationApiUrl).href,
        { operation: 'REPLACE', configuration: definition },
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { tenantId: tenantId?.toString() },
        },
      );

      res.status(HttpStatusCodes.CREATED).send(mapFormDefinition(data.latest.configuration, data.latest.revision));
    } catch (err) {
      next(err);
    }
  };
}

export function updateFormDefinition(directory: ServiceDirectory, tokenProvider: TokenProvider): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant?.id;
      const { definitionId } = req.params;

      if (!isAllowedUser(user, tenantId, FormServiceRoles.Admin, true)) {
        throw new UnauthorizedUserError('update form definition', user);
      }

      const definition: FormDefinition = { ...req.body, id: definitionId };

      const configurationApiUrl = await directory.getServiceUrl(configurationApiId);
      const token = await tokenProvider.getAccessToken();
      const { data } = await axios.patch<{ latest: { revision: number; configuration: FormDefinition } }>(
        new URL(`v2/configuration/form-service/${definitionId}`, configurationApiUrl).href,
        { operation: 'REPLACE', configuration: definition },
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { tenantId: tenantId?.toString() },
        },
      );

      res.send(mapFormDefinition(data.latest.configuration, data.latest.revision));
    } catch (err) {
      next(err);
    }
  };
}

export function deleteFormDefinition(directory: ServiceDirectory, tokenProvider: TokenProvider): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant?.id;
      const { definitionId } = req.params;

      if (!isAllowedUser(user, tenantId, FormServiceRoles.Admin, true)) {
        throw new UnauthorizedUserError('delete form definition', user);
      }

      const configurationApiUrl = await directory.getServiceUrl(configurationApiId);
      const token = await tokenProvider.getAccessToken();
      await axios.delete(new URL(`v2/configuration/form-service/${definitionId}`, configurationApiUrl).href, {
        headers: { Authorization: `Bearer ${token}` },
        params: { tenantId: tenantId?.toString() },
      });

      res.status(HttpStatusCodes.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  };
}

interface FormDefinitionRouterProps {
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  tenantService: TenantService;
  calendarService: CalendarService;
}

export function createFormDefinitionRouter({
  directory,
  tokenProvider,
  tenantService,
  calendarService,
}: FormDefinitionRouterProps): Router {
  const router = Router();

  router.get('/definitions', getFormDefinitions(directory, tokenProvider));
  router.post(
    '/definitions',
    assertAuthenticatedHandler,
    createValidationHandler(
      body('id')
        .isString()
        .isLength({ min: 1, max: 50 })
        .matches(/^[a-zA-Z0-9-]+$/),
      body('name').isString().isLength({ min: 1 }),
      body('anonymousApply').isBoolean(),
      body('applicantRoles').isArray(),
      body('assessorRoles').isArray(),
    ),
    createFormDefinition(directory, tokenProvider),
  );
  router.get(
    '/definitions/:definitionId',
    createValidationHandler(
      param('definitionId')
        .isString()
        .isLength({ min: 1, max: 50 })
        .matches(/^[a-zA-Z0-9-]+$/),
    ),
    getFormDefinition(tenantService, calendarService),
  );
  router.put(
    '/definitions/:definitionId',
    assertAuthenticatedHandler,
    createValidationHandler(
      param('definitionId')
        .isString()
        .isLength({ min: 1, max: 50 })
        .matches(/^[a-zA-Z0-9-]+$/),
    ),
    updateFormDefinition(directory, tokenProvider),
  );
  router.delete(
    '/definitions/:definitionId',
    assertAuthenticatedHandler,
    createValidationHandler(
      param('definitionId')
        .isString()
        .isLength({ min: 1, max: 50 })
        .matches(/^[a-zA-Z0-9-]+$/),
    ),
    deleteFormDefinition(directory, tokenProvider),
  );

  return router;
}
