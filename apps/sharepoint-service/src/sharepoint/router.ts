import { AdspId, isAllowedUser, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { createValidationHandler, InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Request, RequestHandler, Router } from 'express';
import { body, param } from 'express-validator';
import { Logger } from 'winston';
import { CredentialStore } from './credentials';
import { CredentialNotSetError, DestinationDisabledError, SharePointError } from './errors';
import { GraphTokenProvider } from './graph';
import { RowIdentityMissingError } from './mapper';
import { SharePointPusher } from './push';
import { ServiceRoles } from './roles';
import { SharePointConfiguration, TestResult } from './types';

const ID_PATTERN = /^[a-zA-Z0-9-_]{1,50}$/;

function assertRole(req: Request, operation: string, roles: string[], allowCore = false): void {
  if (!isAllowedUser(req.user, req.tenant?.id, roles, allowCore)) {
    throw new UnauthorizedUserError(operation, req.user);
  }
}

function requireTenant(req: Request): AdspId {
  const tenantId = req.tenant?.id;
  if (!tenantId) {
    throw new InvalidOperationError('Tenant context is required.');
  }
  return tenantId;
}

async function getTenantConfiguration(req: Request): Promise<SharePointConfiguration | undefined> {
  const [configuration] = await req.getConfiguration<SharePointConfiguration>();
  return configuration;
}

const logContext = (tenantId: AdspId) => ({ context: 'SharePointRouter', tenant: tenantId.toString() });

export function setCredential(
  credentialStore: CredentialStore,
  tokens: GraphTokenProvider,
  logger: Logger,
): RequestHandler {
  return async (req, res, next) => {
    try {
      assertRole(req, 'set SharePoint credential', [ServiceRoles.Admin]);
      const tenantId = requireTenant(req);
      const { connectionId } = req.params;
      const configuration = await getTenantConfiguration(req);
      if (!configuration?.connections?.[connectionId]) {
        throw new NotFoundError('SharePoint connection', connectionId);
      }

      const status = await credentialStore.set(tenantId, connectionId, req.body.clientSecret);
      tokens.evict(tenantId, connectionId);
      logger.info(
        `Credential set for SharePoint connection '${connectionId}' by ${req.user.name} (ID: ${req.user.id}).`,
        logContext(tenantId),
      );
      res.send(status);
    } catch (err) {
      next(err);
    }
  };
}

export function getCredentialStatus(credentialStore: CredentialStore): RequestHandler {
  return async (req, res, next) => {
    try {
      assertRole(req, 'get SharePoint credential status', [ServiceRoles.Admin]);
      const tenantId = requireTenant(req);
      res.send(await credentialStore.status(tenantId, req.params.connectionId));
    } catch (err) {
      next(err);
    }
  };
}

export function deleteCredential(
  credentialStore: CredentialStore,
  tokens: GraphTokenProvider,
  logger: Logger,
): RequestHandler {
  return async (req, res, next) => {
    try {
      assertRole(req, 'delete SharePoint credential', [ServiceRoles.Admin]);
      const tenantId = requireTenant(req);
      const { connectionId } = req.params;
      await credentialStore.remove(tenantId, connectionId);
      tokens.evict(tenantId, connectionId);
      logger.info(
        `Credential deleted for SharePoint connection '${connectionId}' by ${req.user.name} (ID: ${req.user.id}).`,
        logContext(tenantId),
      );
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  };
}

function toTestFailure(err: unknown): TestResult {
  if (err instanceof CredentialNotSetError) {
    return { ok: false, errorCode: 'credential-not-set' };
  }
  if (err instanceof RowIdentityMissingError) {
    return { ok: false, errorCode: 'row-identity-missing' };
  }
  if (err instanceof SharePointError) {
    return { ok: false, errorCode: err.errorCode, ...(err.column ? { column: err.column } : {}) };
  }
  throw err;
}

export function testDestination(pusher: SharePointPusher, logger: Logger): RequestHandler {
  return async (req, res, next) => {
    try {
      assertRole(req, 'test SharePoint destination', [ServiceRoles.Admin]);
      const tenantId = requireTenant(req);
      const { destinationId } = req.params;
      const configuration = await getTenantConfiguration(req);

      let result: TestResult;
      try {
        await pusher.test(tenantId, configuration, destinationId, req.body);
        result = { ok: true };
      } catch (err) {
        result = toTestFailure(err);
      }
      logger.info(
        `Tested SharePoint destination '${destinationId}' with result: ${result.ok === true ? 'ok' : result.errorCode}.`,
        logContext(tenantId),
      );
      res.send(result);
    } catch (err) {
      next(err);
    }
  };
}

export function pushData(pusher: SharePointPusher, logger: Logger): RequestHandler {
  return async (req, res, next) => {
    try {
      assertRole(req, 'push SharePoint data', [ServiceRoles.Writer], true);
      const tenantId = requireTenant(req);
      const { destinationId } = req.params;
      const configuration = await getTenantConfiguration(req);

      let dataId: string;
      try {
        dataId = await pusher.push(tenantId, configuration, destinationId, req.body);
      } catch (err) {
        if (err instanceof DestinationDisabledError) {
          logger.warn(
            `Push to SharePoint destination '${destinationId}' refused: destination is disabled.`,
            logContext(tenantId),
          );
          res.status(409).send({ errorCode: 'destination-disabled' });
          return;
        }
        if (err instanceof CredentialNotSetError) {
          logger.warn(
            `Push to SharePoint destination '${destinationId}' failed: no credential set.`,
            logContext(tenantId),
          );
          res.status(409).send({ errorCode: 'credential-not-set' });
          return;
        }
        if (err instanceof SharePointError) {
          logger.warn(
            `Push to SharePoint destination '${destinationId}' failed with: ${err.errorCode}.`,
            logContext(tenantId),
          );
          res.status(502).send({
            errorCode: err.errorCode,
            retryable: err.retryable,
            ...(err.column ? { column: err.column } : {}),
          });
          return;
        }
        throw err;
      }

      logger.info(`Pushed item '${dataId}' to SharePoint destination '${destinationId}'.`, logContext(tenantId));
      res.send({ dataId, date: new Date().toISOString() });
    } catch (err) {
      next(err);
    }
  };
}

interface SharePointRouterProps {
  logger: Logger;
  credentialStore: CredentialStore;
  tokens: GraphTokenProvider;
  pusher: SharePointPusher;
}

export function createSharePointRouter({ logger, credentialStore, tokens, pusher }: SharePointRouterProps): Router {
  const router = Router();
  const connectionId = () => param('connectionId').matches(ID_PATTERN);
  const destinationId = () => param('destinationId').matches(ID_PATTERN);

  router.put(
    '/connections/:connectionId/credentials',
    createValidationHandler(connectionId(), body('clientSecret').isString().isLength({ min: 1, max: 1024 })),
    setCredential(credentialStore, tokens, logger),
  );
  router.get(
    '/connections/:connectionId/credentials',
    createValidationHandler(connectionId()),
    getCredentialStatus(credentialStore),
  );
  router.delete(
    '/connections/:connectionId/credentials',
    createValidationHandler(connectionId()),
    deleteCredential(credentialStore, tokens, logger),
  );
  router.post(
    '/destinations/:destinationId/test',
    createValidationHandler(destinationId(), body().isObject()),
    testDestination(pusher, logger),
  );
  router.post(
    '/destinations/:destinationId/data',
    createValidationHandler(destinationId(), body().isObject()),
    pushData(pusher, logger),
  );

  return router;
}
