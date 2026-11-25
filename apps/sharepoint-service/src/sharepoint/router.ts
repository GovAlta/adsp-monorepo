import { AdspId, isAllowedUser, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { createValidationHandler, InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Request, RequestHandler, Response, Router } from 'express';
import { body, param } from 'express-validator';
import { Logger } from 'winston';
import { CredentialStore } from './credentials';
import {
  CredentialNotSetError,
  CredentialUnreadableError,
  DestinationDisabledError,
  DestinationNotSetUpError,
  DetailRowsFailedError,
  SharePointError,
} from './errors';
import { FilesUploadResult, MAX_FILES, SharePointFileService } from './files';
import { GraphTokenProvider } from './graph';
import { RowIdentityMissingError } from './mapper';
import { SharePointPusher } from './push';
import { withRetryScope } from './retry';
import { ServiceRoles } from './roles';
import { ListNameTakenError, SharePointSetup } from './setup';
import { PushResult, SharePointConfiguration, TestResult } from './types';

const ID_PATTERN = /^[a-zA-Z0-9-_]{1,50}$/;

type ClearConfiguration = (tenantId: AdspId) => void;

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
  if (err instanceof CredentialUnreadableError) {
    return { ok: false, errorCode: 'credential-unreadable' };
  }
  if (err instanceof DestinationNotSetUpError) {
    return { ok: false, errorCode: 'destination-not-set-up' };
  }
  if (err instanceof RowIdentityMissingError) {
    return { ok: false, errorCode: 'row-identity-missing' };
  }
  if (err instanceof DetailRowsFailedError) {
    return { ok: false, errorCode: err.errorCode, detailFailures: err.detailFailures };
  }
  if (err instanceof SharePointError) {
    return { ok: false, errorCode: err.errorCode, ...(err.column ? { column: err.column } : {}) };
  }
  throw err;
}

export function testDestination(
  pusher: SharePointPusher,
  fileService: SharePointFileService,
  logger: Logger,
  clearConfiguration: ClearConfiguration = noCacheClear,
): RequestHandler {
  return async (req, res, next) => {
    try {
      assertRole(req, 'test SharePoint destination', [ServiceRoles.Admin]);
      const tenantId = requireTenant(req);
      const { destinationId } = req.params;
      clearConfiguration(tenantId);
      const configuration = await getTenantConfiguration(req);

      let result: TestResult;
      try {
        const { outcome, detailRows } = await withRetryScope(logger, logContext(tenantId), async () => {
          await fileService.checkDocumentLibrary(tenantId, configuration, destinationId);
          return pusher.test(tenantId, configuration, destinationId, req.body);
        });
        result = { ok: true, outcome, ...(detailRows ? { detailRows } : {}) };
      } catch (err) {
        result = toTestFailure(err);
      }
      logger.info(
        `Tested SharePoint destination '${destinationId}' with result: ${result.ok === true ? result.outcome : result.errorCode}.`,
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

      let result: PushResult;
      try {
        result = await withRetryScope(logger, logContext(tenantId), () =>
          pusher.push(tenantId, configuration, destinationId, req.body),
        );
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
        if (err instanceof CredentialUnreadableError) {
          logger.warn(
            `Push to SharePoint destination '${destinationId}' failed: the stored credential cannot be decrypted.`,
            logContext(tenantId),
          );
          res.status(409).send({ errorCode: 'credential-unreadable' });
          return;
        }
        if (err instanceof DestinationNotSetUpError) {
          logger.warn(
            `Push to SharePoint destination '${destinationId}' refused: a detail list is not set up.`,
            logContext(tenantId),
          );
          res.status(409).send({ errorCode: 'destination-not-set-up' });
          return;
        }
        if (err instanceof DetailRowsFailedError) {
          logger.warn(
            `Push to SharePoint destination '${destinationId}' wrote item '${err.dataId}' but some detail rows failed with: ${err.errorCode}.`,
            logContext(tenantId),
          );
          res.status(502).send({
            errorCode: err.errorCode,
            retryable: err.retryable,
            dataId: err.dataId,
            detailFailures: err.detailFailures,
          });
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

      logger.info(
        `Pushed item '${result.itemId}' (${result.outcome}) to SharePoint destination '${destinationId}'.`,
        logContext(tenantId),
      );
      res.send({
        dataId: result.itemId,
        outcome: result.outcome,
        date: new Date().toISOString(),
        ...(result.detailRows ? { detailRows: result.detailRows } : {}),
      });
    } catch (err) {
      next(err);
    }
  };
}

export function uploadFiles(fileService: SharePointFileService, logger: Logger): RequestHandler {
  return async (req, res, next) => {
    try {
      assertRole(req, 'upload SharePoint files', [ServiceRoles.Writer], true);
      const tenantId = requireTenant(req);
      const { destinationId } = req.params;
      const configuration = await getTenantConfiguration(req);

      let result: FilesUploadResult;
      try {
        result = await withRetryScope(logger, logContext(tenantId), () =>
          fileService.upload(tenantId, configuration, destinationId, req.body),
        );
      } catch (err) {
        if (err instanceof DestinationDisabledError) {
          res.status(409).send({ errorCode: 'destination-disabled' });
          return;
        }
        if (err instanceof CredentialNotSetError) {
          res.status(409).send({ errorCode: 'credential-not-set' });
          return;
        }
        if (err instanceof CredentialUnreadableError) {
          res.status(409).send({ errorCode: 'credential-unreadable' });
          return;
        }
        if (err instanceof DestinationNotSetUpError) {
          res.status(409).send({ errorCode: 'destination-not-set-up' });
          return;
        }
        if (err instanceof SharePointError) {
          logger.warn(
            `File upload to SharePoint destination '${destinationId}' failed with: ${err.errorCode}.`,
            logContext(tenantId),
          );
          res.status(502).send({ errorCode: err.errorCode, retryable: err.retryable });
          return;
        }
        throw err;
      }

      const failed = result.files.filter(({ status }) => status === 'failed').length;
      const rowFailed = result.row?.written === false;
      if (result.row?.written === false) {
        logger.warn(
          `Row write for SharePoint destination '${destinationId}' failed with: ${result.row.errorCode}.`,
          logContext(tenantId),
        );
      }
      logger.info(
        `Uploaded ${result.files.length - failed} of ${result.files.length} files to SharePoint destination '${destinationId}'.`,
        logContext(tenantId),
      );

      res.status(failed > 0 || rowFailed ? 502 : 200).send(result);
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
  fileService: SharePointFileService;
  setup: SharePointSetup;
  // Admin actions run right after a configuration save, before the cached copy is invalidated.
  clearConfiguration?: ClearConfiguration;
}

const noCacheClear = () => undefined;

function sendSetupFailure(err: unknown, res: Response): boolean {
  if (err instanceof CredentialNotSetError) {
    res.status(409).send({ errorCode: 'credential-not-set' });
    return true;
  }
  if (err instanceof CredentialUnreadableError) {
    res.status(409).send({ errorCode: 'credential-unreadable' });
    return true;
  }
  if (err instanceof ListNameTakenError) {
    res.status(409).send({ errorCode: 'list-name-taken', lists: err.lists });
    return true;
  }
  if (err instanceof SharePointError) {
    res.status(502).send({ errorCode: err.errorCode, retryable: err.retryable });
    return true;
  }
  return false;
}

export function verifyDestination(
  setup: SharePointSetup,
  logger: Logger,
  clearConfiguration: ClearConfiguration = noCacheClear,
): RequestHandler {
  return async (req, res, next) => {
    try {
      assertRole(req, 'verify SharePoint destination', [ServiceRoles.Admin]);
      const tenantId = requireTenant(req);
      clearConfiguration(tenantId);
      const configuration = await getTenantConfiguration(req);
      try {
        res.send(
          await withRetryScope(logger, logContext(tenantId), () =>
            setup.verify(tenantId, configuration, req.params.destinationId),
          ),
        );
      } catch (err) {
        if (!sendSetupFailure(err, res)) {
          throw err;
        }
      }
    } catch (err) {
      next(err);
    }
  };
}

export function setUpDestination(
  setup: SharePointSetup,
  logger: Logger,
  clearConfiguration: ClearConfiguration = noCacheClear,
): RequestHandler {
  return async (req, res, next) => {
    try {
      assertRole(req, 'set up SharePoint destination', [ServiceRoles.Admin]);
      const tenantId = requireTenant(req);
      const { destinationId } = req.params;
      clearConfiguration(tenantId);
      const configuration = await getTenantConfiguration(req);
      try {
        const result = await withRetryScope(logger, logContext(tenantId), () =>
          setup.setUp(tenantId, configuration, destinationId),
        );
        logger.info(
          `Set up SharePoint destination '${destinationId}' by ${req.user.name} (ID: ${req.user.id}): ` +
            `${result.createdLists.length} lists, ${result.createdColumns.length} columns, ` +
            `${result.indexedColumns.length} indexes, ${result.failures.length} failures` +
            `${result.permissionDenied ? ', the app is not allowed to change lists or columns' : ''}.`,
          logContext(tenantId),
        );
        res.send(result);
      } catch (err) {
        if (!sendSetupFailure(err, res)) {
          throw err;
        }
      }
    } catch (err) {
      next(err);
    }
  };
}

export function createSharePointRouter({
  logger,
  credentialStore,
  tokens,
  pusher,
  fileService,
  setup,
  clearConfiguration = noCacheClear,
}: SharePointRouterProps): Router {
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
    testDestination(pusher, fileService, logger, clearConfiguration),
  );
  router.post(
    '/destinations/:destinationId/data',
    createValidationHandler(destinationId(), body().isObject()),
    pushData(pusher, logger),
  );
  router.post(
    '/destinations/:destinationId/files',
    createValidationHandler(
      destinationId(),
      body('submissionId').isString().isLength({ min: 1, max: 100 }),
      body('files').isArray({ min: 1, max: MAX_FILES }),
      body('files.*.field').isString().isLength({ min: 1, max: 200 }),
      body('files.*.fileId').isString().isLength({ min: 1, max: 300 }),
      body('data').optional().isObject(),
      body('updateRowOnly').optional().isBoolean({ strict: true }),
    ),
    uploadFiles(fileService, logger),
  );
  router.post(
    '/destinations/:destinationId/verify',
    createValidationHandler(destinationId()),
    verifyDestination(setup, logger, clearConfiguration),
  );
  router.post(
    '/destinations/:destinationId/setup',
    createValidationHandler(destinationId()),
    setUpDestination(setup, logger, clearConfiguration),
  );

  return router;
}
