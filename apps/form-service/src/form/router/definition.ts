import {
  AdspId,
  isAllowedUser,
  TenantService,
  TokenProvider,
  ServiceDirectory,
  UnauthorizedUserError,
  adspId,
  toKebabCase,
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
import { body, param, query } from 'express-validator';
import { Logger } from 'winston';
import { FormDefinitionEntity } from '../model';
import { mapFormDefinition } from '../mapper';
import { FormServiceRoles } from '../roles';
import { FormDefinition, Intake } from '../types';
import { CalendarService } from '../calendar';

const configurationApiId = adspId`urn:ads:platform:configuration-service:v2`;

const allowedRoleProperties = ['applicantRoles', 'assessorRoles', 'clerkRoles'];

async function fetchExistingDefinition(
  configurationApiUrl: URL,
  token: string,
  encodedDefinitionId: string,
  tenantId: string,
  definitionId: string,
): Promise<FormDefinition> {
  const response = await axios.get(
    new URL(`v2/configuration/form-service/${encodedDefinitionId}/latest`, configurationApiUrl).href,
    {
      headers: { Authorization: `Bearer ${token}` },
      params: { tenantId },
      validateStatus: (status) => status === HttpStatusCodes.OK || status === HttpStatusCodes.NOT_FOUND,
    },
  );

  if (response.status === HttpStatusCodes.NOT_FOUND || !response.data) {
    throw new NotFoundError('form definition', definitionId);
  }

  return response.data as FormDefinition;
}

async function patchConfigurationDefinition(
  configurationApiUrl: URL,
  token: string,
  definitionId: string,
  tenantId: string,
  definition: FormDefinition,
): Promise<{ latest: { revision: number; configuration: FormDefinition } }> {
  try {
    const response = await axios.patch<{ latest: { revision: number; configuration: FormDefinition } }>(
      new URL(`v2/configuration/form-service/${encodeURIComponent(definitionId)}`, configurationApiUrl).href,
      { operation: 'REPLACE', configuration: definition },
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { tenantId },
      },
    );
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const message = err.response?.data?.errorMessage || 'Configuration service rejected the request.';
      throw new InvalidOperationError(message, { statusCode: HttpStatusCodes.BAD_REQUEST });
    }
    throw err;
  }
}

export function getFormDefinitions(directory: ServiceDirectory, tokenProvider: TokenProvider): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant?.id;
      const { top: topValue, after, name, createDateAfter, createDateBefore } = req.query;

      if (!isAllowedUser(user, tenantId, FormServiceRoles.Admin)) {
        throw new UnauthorizedUserError('access definitions', user);
      }

      const configurationApiUrl = await directory.getServiceUrl(configurationApiId);
      const token = await tokenProvider.getAccessToken();

      const params: Record<string, string> = {
        includeActive: 'true',
      };

      if (topValue) {
        params.top = topValue as string;
      }

      if (tenantId) {
        params.tenantId = tenantId.toString();
      }

      if (after) {
        params.after = after as string;
      }

      const criteria: Record<string, string> = {
        ...(name ? { nameContains: name as string } : {}),
        ...(createDateAfter ? { createDateAfter: createDateAfter as string } : {}),
        ...(createDateBefore ? { createDateBefore: createDateBefore as string } : {}),
      };

      const hasCriteria = Object.keys(criteria).length > 0;
      if (hasCriteria) {
        params.criteria = JSON.stringify(criteria);
      }

      const { data } = await axios.get<
        Results<{
          latest: { revision: number; configuration: FormDefinition; created?: string };
          active: { revision: number; configuration: FormDefinition; created?: string };
        }>
      >(new URL('v2/configuration/form-service', configurationApiUrl).href, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      res.send({
        ...data,
        results: data.results.map(({ latest, active }) =>
          active
            ? mapFormDefinition(active.configuration, active.revision, undefined, latest.created as unknown as Date)
            : mapFormDefinition(latest.configuration, latest.revision, undefined, latest.created as unknown as Date),
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

export function createFormDefinition(
  directory: ServiceDirectory,
  tokenProvider: TokenProvider,
  logger: Logger,
): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant?.id;

      if (!isAllowedUser(user, tenantId, FormServiceRoles.Admin, true)) {
        throw new UnauthorizedUserError('create form definition', user);
      }

      const generatedId = toKebabCase(req.body.name);

      if (!generatedId) {
        throw new InvalidOperationError('Form definition ID could not be generated from the provided name.');
      }

      const definition: FormDefinition = {
        id: generatedId,
        name: req.body.name,
        description: req.body.description ?? '',
        anonymousApply: false,
        applicantRoles: [],
        assessorRoles: [],
        clerkRoles: [],
        dataSchema: {},
        securityClassification: 'protected b',
      };

      const configurationApiUrl = await directory.getServiceUrl(configurationApiId);
      const token = await tokenProvider.getAccessToken();

      // Check if definition already exists — return 409 if so.
      let existingFormId = undefined;
      try {
        const [existing] = await req.getServiceConfiguration<FormDefinitionEntity>(definition.id, tenantId);
        existingFormId = existing?.id;
      } catch (err) {
        logger.warn(`Failed to check existing form definition '${definition.id}': ${err}`);
      } finally {
        logger.debug(`Existence check completed for form definition '${definition.id}'.`);
      }

      if (existingFormId) {
        throw new InvalidOperationError(`Form definition with ID '${definition.id}' already exists.`, {
          statusCode: HttpStatusCodes.CONFLICT,
        });
      }

      const data = await patchConfigurationDefinition(
        configurationApiUrl,
        token,
        definition.id,
        tenantId?.toString(),
        definition,
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
      const data = await patchConfigurationDefinition(
        configurationApiUrl,
        token,
        definitionId,
        tenantId?.toString(),
        definition,
      );

      res.send(mapFormDefinition(data.latest.configuration, data.latest.revision));
    } catch (err) {
      next(err);
    }
  };
}

export function patchFormDefinition(directory: ServiceDirectory, tokenProvider: TokenProvider): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant?.id;
      const { definitionId } = req.params;

      if (!isAllowedUser(user, tenantId, FormServiceRoles.Admin, true)) {
        throw new UnauthorizedUserError('patch form definition', user);
      }

      const encodedDefinitionId = encodeURIComponent(definitionId);
      const configurationApiUrl = await directory.getServiceUrl(configurationApiId);
      const token = await tokenProvider.getAccessToken();

      const existingDefinition = await fetchExistingDefinition(
        configurationApiUrl,
        token,
        encodedDefinitionId,
        tenantId?.toString(),
        definitionId,
      );

      const patchedDefinition: FormDefinition = {
        ...existingDefinition,
        ...(req.body.name !== undefined ? { name: req.body.name } : {}),
        ...(req.body.description !== undefined ? { description: req.body.description } : {}),
        ...(req.body.dataSchema !== undefined ? { dataSchema: req.body.dataSchema } : {}),
        ...(req.body.uiSchema !== undefined ? { uiSchema: req.body.uiSchema } : {}),
        id: definitionId,
      };

      const data = await patchConfigurationDefinition(
        configurationApiUrl,
        token,
        definitionId,
        tenantId?.toString(),
        patchedDefinition,
      );

      res.status(HttpStatusCodes.OK).send(mapFormDefinition(data.latest.configuration, data.latest.revision));
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
      await axios.delete(
        new URL(`v2/configuration/form-service/${encodeURIComponent(definitionId)}`, configurationApiUrl).href,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { tenantId: tenantId?.toString() },
        },
      );

      res.status(HttpStatusCodes.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  };
}

export function updateFormDefinitionSchemas(directory: ServiceDirectory, tokenProvider: TokenProvider): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant?.id;
      const { definitionId } = req.params;

      if (!isAllowedUser(user, tenantId, FormServiceRoles.Admin, true)) {
        throw new UnauthorizedUserError('update form definition schemas', user);
      }

      const encodedDefinitionId = encodeURIComponent(definitionId);
      const configurationApiUrl = await directory.getServiceUrl(configurationApiId);
      const token = await tokenProvider.getAccessToken();

      const existingDefinition = await fetchExistingDefinition(
        configurationApiUrl,
        token,
        encodedDefinitionId,
        tenantId?.toString(),
        definitionId,
      );

      const updatedDefinition: FormDefinition = {
        ...existingDefinition,
        dataSchema: req.body['data-schema'] !== undefined ? req.body['data-schema'] : existingDefinition.dataSchema,
        uiSchema: req.body['ui-schema'] !== undefined ? req.body['ui-schema'] : existingDefinition.uiSchema,
        id: definitionId,
      };

      await patchConfigurationDefinition(
        configurationApiUrl,
        token,
        definitionId,
        tenantId?.toString(),
        updatedDefinition,
      );

      res.status(HttpStatusCodes.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  };
}

export function updateFormDefinitionRoles(directory: ServiceDirectory, tokenProvider: TokenProvider): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant?.id;
      const { definitionId } = req.params;

      if (!isAllowedUser(user, tenantId, FormServiceRoles.Admin, true)) {
        throw new UnauthorizedUserError('update form definition roles', user);
      }

      const encodedDefinitionId = encodeURIComponent(definitionId);
      const configurationApiUrl = await directory.getServiceUrl(configurationApiId);
      const token = await tokenProvider.getAccessToken();

      const existingDefinition = await fetchExistingDefinition(
        configurationApiUrl,
        token,
        encodedDefinitionId,
        tenantId?.toString(),
        definitionId,
      );

      // Roles are replaced entirely; any role array omitted from the request is reset to empty.
      const updatedDefinition: FormDefinition = {
        ...existingDefinition,
        applicantRoles: req.body.applicantRoles ?? [],
        assessorRoles: req.body.assessorRoles ?? [],
        clerkRoles: req.body.clerkRoles ?? [],
        id: definitionId,
      };

      const data = await patchConfigurationDefinition(
        configurationApiUrl,
        token,
        definitionId,
        tenantId?.toString(),
        updatedDefinition,
      );

      res.status(HttpStatusCodes.OK).send(mapFormDefinition(data.latest.configuration, data.latest.revision));
    } catch (err) {
      next(err);
    }
  };
}

export function patchFormDefinitionLifecycle(
  directory: ServiceDirectory,
  tokenProvider: TokenProvider,
): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant?.id;
      const { definitionId } = req.params;

      if (!isAllowedUser(user, tenantId, FormServiceRoles.Admin, true)) {
        throw new UnauthorizedUserError('patch form definition lifecycle', user);
      }

      const encodedDefinitionId = encodeURIComponent(definitionId);
      const configurationApiUrl = await directory.getServiceUrl(configurationApiId);
      const token = await tokenProvider.getAccessToken();

      const existingDefinition = await fetchExistingDefinition(
        configurationApiUrl,
        token,
        encodedDefinitionId,
        tenantId?.toString(),
        definitionId,
      );

      const updatedDefinition: FormDefinition = {
        ...existingDefinition,
        ...(req.body.allowAnonymousApplication !== undefined
          ? { anonymousApply: req.body.allowAnonymousApplication }
          : {}),
        ...(req.body.allowMultipleFormsPerApplicant !== undefined
          ? { oneFormPerApplicant: !req.body.allowMultipleFormsPerApplicant }
          : {}),
        ...(req.body.createSupportTopic !== undefined ? { supportTopic: req.body.createSupportTopic } : {}),
        ...(req.body.securityClassification !== undefined
          ? { securityClassification: req.body.securityClassification }
          : {}),
        id: definitionId,
      };

      const data = await patchConfigurationDefinition(
        configurationApiUrl,
        token,
        definitionId,
        tenantId?.toString(),
        updatedDefinition,
      );

      res.send(mapFormDefinition(data.latest.configuration, data.latest.revision));
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
  logger: Logger;
}

export function createFormDefinitionRouter({
  directory,
  tokenProvider,
  tenantService,
  calendarService,
  logger,
}: FormDefinitionRouterProps): Router {
  const router = Router();

  router.get(
    '/definitions',
    createValidationHandler(
      query('createDateAfter').optional().isISO8601(),
      query('createDateBefore').optional().isISO8601(),
    ),
    getFormDefinitions(directory, tokenProvider),
  );
  router.post(
    '/definitions',
    assertAuthenticatedHandler,
    createValidationHandler(body('name').isString().isLength({ min: 1 }), body('description').optional().isString()),
    createFormDefinition(directory, tokenProvider, logger),
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
      body('formDraftUrlTemplate')
        .optional()
        .isString()
        .isLength({ min: 6, max: 500 })
        .isURL({ protocols: ['http', 'https'], require_protocol: true }),
    ),
    updateFormDefinition(directory, tokenProvider),
  );

  router.patch(
    '/definitions/:definitionId',
    assertAuthenticatedHandler,
    createValidationHandler(
      param('definitionId')
        .isString()
        .isLength({ min: 1, max: 50 })
        .matches(/^[a-zA-Z0-9-]+$/),
      body('name').optional().isString().isLength({ min: 1 }),
      body('description').optional().isString(),
      body('dataSchema').optional().isObject(),
      body('uiSchema').optional().isObject(),
      body('formDraftUrlTemplate')
        .optional()
        .isString()
        .isLength({ min: 6, max: 500 })
        .isURL({ protocols: ['http', 'https'], require_protocol: true }),
    ),
    patchFormDefinition(directory, tokenProvider),
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

  router.put(
    '/definitions/:definitionId/schemas',
    assertAuthenticatedHandler,
    createValidationHandler(
      param('definitionId')
        .isString()
        .isLength({ min: 1, max: 50 })
        .matches(/^[a-zA-Z0-9-]+$/),
      body('data-schema').optional().isObject(),
      body('ui-schema').optional().isObject(),
    ),
    updateFormDefinitionSchemas(directory, tokenProvider),
  );

  router.put(
    '/definitions/:definitionId/roles',
    assertAuthenticatedHandler,
    createValidationHandler(
      param('definitionId')
        .isString()
        .isLength({ min: 1, max: 50 })
        .matches(/^[a-zA-Z0-9-]+$/),
      body('applicantRoles').optional().isArray(),
      body('applicantRoles.*').isString(),
      body('assessorRoles').optional().isArray(),
      body('assessorRoles.*').isString(),
      body('clerkRoles').optional().isArray(),
      body('clerkRoles.*').isString(),
      body().custom((value) => {
        const extra = Object.keys(value ?? {}).filter((key) => !allowedRoleProperties.includes(key));
        if (extra.length > 0) {
          throw new Error(`Unsupported properties: ${extra.join(', ')}`);
        }
        return true;
      }),
    ),
    updateFormDefinitionRoles(directory, tokenProvider),
  );

  router.patch(
    '/definitions/:definitionId/lifecycle',
    assertAuthenticatedHandler,
    createValidationHandler(
      param('definitionId')
        .isString()
        .isLength({ min: 1, max: 50 })
        .matches(/^[a-zA-Z0-9-]+$/),
      body('allowAnonymousApplication').optional().isBoolean(),
      body('allowMultipleFormsPerApplicant').optional().isBoolean(),
      body('createSupportTopic').optional().isBoolean(),
      body('securityClassification')
        .optional()
        .isString()
        .isIn(['protected a', 'protected b', 'protected c', 'public']),
    ),
    patchFormDefinitionLifecycle(directory, tokenProvider),
  );

  return router;
}
