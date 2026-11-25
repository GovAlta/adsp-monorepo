import {
  AdspId,
  AuditAction,
  AuditService,
  EventService,
  isAllowedUser,
  UnauthorizedUserError,
} from '@abgov/adsp-service-sdk';
import { createValidationHandler, InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Request, RequestHandler, Response, Router } from 'express';
import { body, param } from 'express-validator';
import { Logger } from 'winston';
import {
  AuditRecorder,
  connectionResource,
  createAuditRecorder,
  CredentialDeletedAuditAction,
  CredentialSetAuditAction,
  DataPushedAuditAction,
  destinationResource,
  DestinationSetUpAuditAction,
  DestinationTestedAuditAction,
  DestinationVerifiedAuditAction,
  FilePushedAuditAction,
} from './audit';
import { CredentialStore } from './credentials';
import {
  ConnectionNotFoundError,
  CredentialNotSetError,
  CredentialUnreadableError,
  DestinationDisabledError,
  DestinationNotFoundError,
  DestinationNotSetUpError,
  DetailRowsFailedError,
  SharePointError,
} from './errors';
import {
  createEventSignal,
  credentialDeleted,
  credentialSet,
  EventSignal,
  FileFailure,
  fileUploadFailed,
  pushFailed,
} from './events';
import { FailedFileResult, FilesUploadRequest, FilesUploadResult, MAX_FILES, SharePointFileService } from './files';
import { GraphTokenProvider } from './graph';
import { RowIdentityMissingError } from './mapper';
import { SharePointPusher } from './push';
import { withRetryScope } from './retry';
import { ServiceRoles } from './roles';
import { ListNameTakenError, SharePointSetup } from './setup';
import { DetailFailure, PushOutcome, PushResult, SharePointConfiguration, TestResult } from './types';

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

const connectionIdOf = (configuration: SharePointConfiguration | undefined, destinationId: string) =>
  configuration?.destinations?.[destinationId]?.connectionId;

const logContext = (tenantId: AdspId) => ({ context: 'SharePointRouter', tenant: tenantId.toString() });

// Only the caller's own row key is used, since a key built from idempotency fields can hold personal data.
function rowKeyOf(data: Record<string, unknown> | undefined): string | undefined {
  const key = (data?._adsp as Record<string, unknown> | undefined)?.key;
  return typeof key === 'string' ? key : undefined;
}

interface WrittenRow {
  connectionId: string | undefined;
  itemId: string;
  outcome: PushOutcome;
  detailRowsFailed?: boolean;
}

function auditRowWritten(
  audit: AuditRecorder,
  req: Request,
  action: AuditAction,
  data: Record<string, unknown> | undefined,
  { connectionId, itemId, outcome, detailRowsFailed }: WrittenRow,
): void {
  const correlationId = rowKeyOf(data);
  audit(req, action, {
    resource: destinationResource(req.params.destinationId),
    ...(correlationId ? { correlationId } : {}),
    metadata: { connectionId, sharepointItemId: itemId, outcome, ...(detailRowsFailed ? { detailRowsFailed } : {}) },
  });
}

interface WriteFailure {
  status: 409 | 502;
  body: { errorCode: string; retryable?: boolean; column?: string; dataId?: string; detailFailures?: DetailFailure[] };
}

function toWriteFailure(err: unknown): WriteFailure | null {
  if (err instanceof DestinationDisabledError) {
    return { status: 409, body: { errorCode: 'destination-disabled' } };
  }
  if (err instanceof CredentialNotSetError) {
    return { status: 409, body: { errorCode: 'credential-not-set' } };
  }
  if (err instanceof CredentialUnreadableError) {
    return { status: 409, body: { errorCode: 'credential-unreadable' } };
  }
  if (err instanceof DestinationNotSetUpError) {
    return { status: 409, body: { errorCode: 'destination-not-set-up' } };
  }
  if (err instanceof DetailRowsFailedError) {
    const { errorCode, retryable, dataId, detailFailures } = err;
    return { status: 502, body: { errorCode, retryable, dataId, detailFailures } };
  }
  if (err instanceof SharePointError) {
    const { errorCode, retryable, column } = err;
    return { status: 502, body: { errorCode, retryable, ...(column ? { column } : {}) } };
  }
  return null;
}

// A 409 needs a configuration change, so like a failure a retry can't fix, it's for an admin to act on.
const isForAdmin = ({ body }: WriteFailure) => body.retryable !== true;

const isTargetNotFound = (err: unknown): err is DestinationNotFoundError | ConnectionNotFoundError =>
  err instanceof DestinationNotFoundError || err instanceof ConnectionNotFoundError;

export function setCredential(
  credentialStore: CredentialStore,
  tokens: GraphTokenProvider,
  logger: Logger,
  audit: AuditRecorder,
  signal: EventSignal,
  clearConfiguration: ClearConfiguration = noCacheClear,
): RequestHandler {
  return async (req, res, next) => {
    try {
      assertRole(req, 'set SharePoint credential', [ServiceRoles.Admin]);
      const tenantId = requireTenant(req);
      const { connectionId } = req.params;
      clearConfiguration(tenantId);
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
      audit(req, CredentialSetAuditAction, {
        resource: connectionResource(connectionId),
        metadata: { connectionId, keyVersion: credentialStore.keyVersion },
      });
      signal(credentialSet(tenantId, connectionId, req.user));
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
  audit: AuditRecorder,
  signal: EventSignal,
): RequestHandler {
  return async (req, res, next) => {
    try {
      assertRole(req, 'delete SharePoint credential', [ServiceRoles.Admin]);
      const tenantId = requireTenant(req);
      const { connectionId } = req.params;
      const deleted = await credentialStore.remove(tenantId, connectionId);
      tokens.evict(tenantId, connectionId);
      logger.info(
        `Credential deleted for SharePoint connection '${connectionId}' by ${req.user.name} (ID: ${req.user.id}).`,
        logContext(tenantId),
      );
      if (deleted) {
        audit(req, CredentialDeletedAuditAction, {
          resource: connectionResource(connectionId),
          metadata: { connectionId },
        });
        signal(credentialDeleted(tenantId, connectionId, req.user));
      }
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
  audit: AuditRecorder,
  clearConfiguration: ClearConfiguration = noCacheClear,
): RequestHandler {
  return async (req, res, next) => {
    try {
      assertRole(req, 'test SharePoint destination', [ServiceRoles.Admin]);
      const tenantId = requireTenant(req);
      const { destinationId } = req.params;
      clearConfiguration(tenantId);
      const configuration = await getTenantConfiguration(req);
      const connectionId = connectionIdOf(configuration, destinationId);

      let result: TestResult;
      try {
        const { itemId, outcome, detailRows } = await withRetryScope(logger, logContext(tenantId), async () => {
          await fileService.checkDocumentLibrary(tenantId, configuration, destinationId);
          return pusher.test(tenantId, configuration, destinationId, req.body);
        });
        auditRowWritten(audit, req, DestinationTestedAuditAction, req.body, { connectionId, itemId, outcome });
        result = { ok: true, outcome, ...(detailRows ? { detailRows } : {}) };
      } catch (err) {
        if (err instanceof DetailRowsFailedError) {
          auditRowWritten(audit, req, DestinationTestedAuditAction, req.body, {
            connectionId,
            itemId: err.dataId,
            outcome: err.outcome,
            detailRowsFailed: true,
          });
        }
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

export function pushData(
  pusher: SharePointPusher,
  logger: Logger,
  audit: AuditRecorder,
  signal: EventSignal,
): RequestHandler {
  return async (req, res, next) => {
    try {
      assertRole(req, 'push SharePoint data', [ServiceRoles.Writer], true);
      const tenantId = requireTenant(req);
      const { destinationId } = req.params;
      const configuration = await getTenantConfiguration(req);
      const connectionId = connectionIdOf(configuration, destinationId);

      let result: PushResult;
      try {
        result = await withRetryScope(logger, logContext(tenantId), () =>
          pusher.push(tenantId, configuration, destinationId, req.body),
        );
      } catch (err) {
        const failure = toWriteFailure(err);
        if (!failure) {
          if (isTargetNotFound(err)) {
            signal(pushFailed(tenantId, destinationId, { errorCode: err.errorCode }, rowKeyOf(req.body)));
          }
          throw err;
        }
        const { errorCode, column, dataId } = failure.body;
        logger.warn(
          `Push to SharePoint destination '${destinationId}' failed with: ${errorCode}` +
            `${dataId ? `, after writing item '${dataId}'` : ''}.`,
          logContext(tenantId),
        );
        if (err instanceof DetailRowsFailedError) {
          auditRowWritten(audit, req, DataPushedAuditAction, req.body, {
            connectionId,
            itemId: err.dataId,
            outcome: err.outcome,
            detailRowsFailed: true,
          });
        }
        if (isForAdmin(failure)) {
          signal(pushFailed(tenantId, destinationId, { errorCode, column, dataId }, rowKeyOf(req.body)));
        }
        res.status(failure.status).send(failure.body);
        return;
      }

      logger.info(
        `Pushed item '${result.itemId}' (${result.outcome}) to SharePoint destination '${destinationId}'.`,
        logContext(tenantId),
      );
      auditRowWritten(audit, req, DataPushedAuditAction, req.body, {
        connectionId,
        itemId: result.itemId,
        outcome: result.outcome,
      });
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

export function uploadFiles(
  fileService: SharePointFileService,
  logger: Logger,
  audit: AuditRecorder,
  signal: EventSignal,
): RequestHandler {
  return async (req, res, next) => {
    try {
      assertRole(req, 'upload SharePoint files', [ServiceRoles.Writer], true);
      const tenantId = requireTenant(req);
      const { destinationId } = req.params;
      const configuration = await getTenantConfiguration(req);
      const { submissionId, files, data } = req.body as FilesUploadRequest;
      const signalFileFailures = (failures: FileFailure[]) => {
        if (failures.length) {
          signal(fileUploadFailed(tenantId, destinationId, submissionId, failures));
        }
      };
      const signalAllFilesFailed = (errorCode: string) =>
        signalFileFailures(files.map(({ field, fileId }) => ({ field, fileId, errorCode })));

      let result: FilesUploadResult;
      try {
        result = await withRetryScope(logger, logContext(tenantId), () =>
          fileService.upload(tenantId, configuration, destinationId, req.body),
        );
      } catch (err) {
        const failure = toWriteFailure(err);
        if (!failure) {
          if (isTargetNotFound(err)) {
            signalAllFilesFailed(err.errorCode);
          }
          throw err;
        }
        const { errorCode } = failure.body;
        logger.warn(
          `File upload to SharePoint destination '${destinationId}' failed with: ${errorCode}.`,
          logContext(tenantId),
        );
        if (isForAdmin(failure)) {
          signalAllFilesFailed(errorCode);
        }
        res.status(failure.status).send(failure.body);
        return;
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

      const connectionId = connectionIdOf(configuration, destinationId);
      result.files.forEach((file) => {
        if (file.status === 'uploaded') {
          audit(req, FilePushedAuditAction, {
            resource: destinationResource(destinationId),
            correlationId: submissionId,
            metadata: {
              connectionId,
              submissionId,
              field: file.field,
              fileId: file.fileId,
              sharepointFileId: file.id,
              size: file.size,
            },
          });
        }
      });
      const { row } = result;
      if (row?.dataId && row.outcome) {
        auditRowWritten(audit, req, DataPushedAuditAction, data, {
          connectionId,
          itemId: row.dataId,
          outcome: row.outcome,
          detailRowsFailed: !row.written,
        });
      }

      signalFileFailures(
        result.files
          .filter((file): file is FailedFileResult => file.status === 'failed' && !file.retryable)
          .map(({ field, fileId, errorCode }) => ({ field, fileId, errorCode })),
      );
      if (row?.written === false && !row.retryable) {
        signal(pushFailed(tenantId, destinationId, { errorCode: row.errorCode, dataId: row.dataId }, rowKeyOf(data)));
      }

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
  auditService: AuditService;
  eventService: EventService;
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
  audit: AuditRecorder,
  clearConfiguration: ClearConfiguration = noCacheClear,
): RequestHandler {
  return async (req, res, next) => {
    try {
      assertRole(req, 'verify SharePoint destination', [ServiceRoles.Admin]);
      const tenantId = requireTenant(req);
      const { destinationId } = req.params;
      clearConfiguration(tenantId);
      const configuration = await getTenantConfiguration(req);
      try {
        const result = await withRetryScope(logger, logContext(tenantId), () =>
          setup.verify(tenantId, configuration, destinationId),
        );
        audit(req, DestinationVerifiedAuditAction, {
          resource: destinationResource(destinationId),
          metadata: { connectionId: connectionIdOf(configuration, destinationId), ready: result.ready },
        });
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

export function setUpDestination(
  setup: SharePointSetup,
  logger: Logger,
  audit: AuditRecorder,
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
        audit(req, DestinationSetUpAuditAction, {
          resource: destinationResource(destinationId),
          metadata: {
            connectionId: connectionIdOf(configuration, destinationId),
            createdLists: result.createdLists.length,
            createdColumns: result.createdColumns.length,
            indexedColumns: result.indexedColumns.length,
            failures: result.failures.length,
            permissionDenied: result.permissionDenied,
          },
        });
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
  auditService,
  eventService,
  clearConfiguration = noCacheClear,
}: SharePointRouterProps): Router {
  const router = Router();
  const audit = createAuditRecorder(auditService, logger);
  const signal = createEventSignal(eventService, logger);
  const connectionId = () => param('connectionId').matches(ID_PATTERN);
  const destinationId = () => param('destinationId').matches(ID_PATTERN);

  router.put(
    '/connections/:connectionId/credentials',
    createValidationHandler(connectionId(), body('clientSecret').isString().isLength({ min: 1, max: 1024 })),
    setCredential(credentialStore, tokens, logger, audit, signal, clearConfiguration),
  );
  router.get(
    '/connections/:connectionId/credentials',
    createValidationHandler(connectionId()),
    getCredentialStatus(credentialStore),
  );
  router.delete(
    '/connections/:connectionId/credentials',
    createValidationHandler(connectionId()),
    deleteCredential(credentialStore, tokens, logger, audit, signal),
  );
  router.post(
    '/destinations/:destinationId/test',
    createValidationHandler(destinationId(), body().isObject()),
    testDestination(pusher, fileService, logger, audit, clearConfiguration),
  );
  router.post(
    '/destinations/:destinationId/data',
    createValidationHandler(destinationId(), body().isObject()),
    pushData(pusher, logger, audit, signal),
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
    uploadFiles(fileService, logger, audit, signal),
  );
  router.post(
    '/destinations/:destinationId/verify',
    createValidationHandler(destinationId()),
    verifyDestination(setup, logger, audit, clearConfiguration),
  );
  router.post(
    '/destinations/:destinationId/setup',
    createValidationHandler(destinationId()),
    setUpDestination(setup, logger, audit, clearConfiguration),
  );

  return router;
}
