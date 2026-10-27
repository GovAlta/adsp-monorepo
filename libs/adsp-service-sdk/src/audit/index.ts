import type { MeterProvider } from '@opentelemetry/api';
import type { Logger } from 'winston';
import type { TokenProvider } from '../access';
import type { ServiceDirectory } from '../directory';
import type { AdspId } from '../utils';
import { AuditClientOptions, AuditServiceImpl } from './auditService';

export { auditDefinitions, AuditCategories, AuditSeverities, BuiltInRetentionClasses } from './definitions';
export type { AuditAction, AuditActionDefinition, AuditCategory, AuditSeverity } from './definitions';
export type { AuditClientOptions } from './auditService';
export type {
  AuditActor,
  AuditActorType,
  AuditChangeSet,
  AuditDropReason,
  AuditEventCriteria,
  AuditEventRecord,
  AuditEventStatus,
  AuditQueryOptions,
  AuditRecordDetails,
  AuditRecordOutcome,
  AuditResource,
  AuditService,
} from './types';

interface AuditServiceOptions extends AuditClientOptions {
  isCore: boolean;
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  serviceId: AdspId;
  /** Settles when action registration completes; sending waits for it. */
  ready?: Promise<unknown>;
  meterProvider?: MeterProvider;
}

export const createAuditService = ({
  isCore,
  logger,
  directory,
  tokenProvider,
  serviceId,
  ...options
}: AuditServiceOptions): AuditServiceImpl => {
  return new AuditServiceImpl(isCore, logger, directory, tokenProvider, serviceId, options);
};
