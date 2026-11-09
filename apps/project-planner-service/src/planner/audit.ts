import {
  AdspId,
  AuditAction,
  AuditActor,
  AuditCategories,
  AuditChangeSet,
  AuditRecordDetails,
  AuditService,
  AuditSeverities,
  BuiltInRetentionClasses,
  getContextTrace,
  toAuditActor,
  User,
} from '@abgov/adsp-service-sdk';
import { RequestHandler } from 'express';
import { Logger } from 'winston';
import { isPlannerAdmin, loaded } from './access';
import { AnalysisMode, BusinessPattern, PatternSource, Solution, SpecialistChat } from './types';

const SOLUTION_RESOURCE_TYPE = 'solution';
const PATTERN_RESOURCE_TYPE = 'pattern';
const SPECIALIST_CHAT_RESOURCE_TYPE = 'specialist-chat';
const MAX_JSON_FIELD_BYTES = 16 * 1024;

export const SolutionCreatedAuditAction: AuditAction = {
  name: 'planner.solution.created',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: SOLUTION_RESOURCE_TYPE,
  description: 'A planner solution is created.',
};

export const SolutionDeletedAuditAction: AuditAction = {
  name: 'planner.solution.deleted',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: SOLUTION_RESOURCE_TYPE,
  description: 'A planner solution is deleted.',
};

export const SolutionExportedAuditAction: AuditAction = {
  name: 'planner.solution.exported',
  version: 1,
  category: AuditCategories.DataAccess,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: SOLUTION_RESOURCE_TYPE,
  description: 'A planner solution or a saved version of it is downloaded.',
};

export const SolutionAdminAccessedAuditAction: AuditAction = {
  name: 'planner.solution.admin-accessed',
  version: 1,
  category: AuditCategories.DataAccess,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: SOLUTION_RESOURCE_TYPE,
  description: 'A planner administrator reads, changes or exports a solution owned by another user.',
};

export const SolutionAnalyzedAuditAction: AuditAction = {
  name: 'planner.solution.analyzed',
  version: 1,
  category: AuditCategories.Runtime,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: SOLUTION_RESOURCE_TYPE,
  description: 'Solution content is sent to the AI model. The content itself is not recorded.',
};

export const PatternCreatedAuditAction: AuditAction = {
  name: 'planner.pattern.created',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: PATTERN_RESOURCE_TYPE,
  description: 'A tenant business pattern is created.',
};

export const PatternUpdatedAuditAction: AuditAction = {
  name: 'planner.pattern.updated',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: PATTERN_RESOURCE_TYPE,
  description: 'A business pattern is updated, or a built-in pattern is customized for the tenant.',
  captureChangeSet: true,
};

export const PatternDeletedAuditAction: AuditAction = {
  name: 'planner.pattern.deleted',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: PATTERN_RESOURCE_TYPE,
  description: 'A custom business pattern is deleted, or a customized built-in pattern is reset.',
};

// Exporting all chats has no single chat resource, so this action does not fix the resource type.
export const SpecialistChatExportedAuditAction: AuditAction = {
  name: 'planner.specialist-chat.exported',
  version: 1,
  category: AuditCategories.DataAccess,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  description: 'One or all saved specialist chats of a user are downloaded.',
};

export const SpecialistChatDeletedAuditAction: AuditAction = {
  name: 'planner.specialist-chat.deleted',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: SPECIALIST_CHAT_RESOURCE_TYPE,
  description: 'A saved specialist chat is deleted.',
};

export const PlannerAuditActions: AuditAction[] = [
  SolutionCreatedAuditAction,
  SolutionDeletedAuditAction,
  SolutionExportedAuditAction,
  SolutionAdminAccessedAuditAction,
  SolutionAnalyzedAuditAction,
  PatternCreatedAuditAction,
  PatternUpdatedAuditAction,
  PatternDeletedAuditAction,
  SpecialistChatExportedAuditAction,
  SpecialistChatDeletedAuditAction,
];

export type AdminAccessOperation = 'read' | 'update' | 'delete' | 'export';
export type AnalyzedEndpoint = 'analyze' | 'discovery' | 'chat' | 'blueprint' | 'consult' | 'specialist-chat';

/** The actor is the signed-in user, without the email address. */
export function toPlannerAuditActor(user: User): AuditActor {
  const { id, type, name, roles } = toAuditActor(user);
  return { id, type, name, roles };
}

/** Correlation ID of an audit record: the ID of the active request trace, when tracing is on. */
export function auditCorrelationId(): string | undefined {
  return getContextTrace()?.toString().split('-')[1] || undefined;
}

const toDetails = (
  user: User,
  tenantId: AdspId,
  resource: AuditRecordDetails['resource'],
  metadata: Record<string, unknown>,
): AuditRecordDetails => ({
  tenantId,
  actor: toPlannerAuditActor(user),
  resource,
  correlationId: auditCorrelationId(),
  metadata,
});

/** Builds the details of a solution audit record. Solution content is never included; only IDs and enumerated values. */
export function toSolutionAuditDetails(
  user: User,
  solution: Pick<Solution, 'tenantId' | 'id' | 'name'>,
  metadata: Record<string, unknown> = {},
): AuditRecordDetails {
  return toDetails(
    user,
    solution.tenantId,
    { type: SOLUTION_RESOURCE_TYPE, id: solution.id, name: solution.name },
    metadata,
  );
}

export function toPatternAuditDetails(
  user: User,
  tenantId: AdspId,
  pattern: { id: string; name?: string },
  metadata: { source: PatternSource } & Record<string, unknown>,
): AuditRecordDetails {
  return toDetails(user, tenantId, { type: PATTERN_RESOURCE_TYPE, id: pattern.id, name: pattern.name }, metadata);
}

/** Builds the details of a specialist chat audit record. The chat title and messages are never included. */
export function toSpecialistChatAuditDetails(
  user: User,
  tenantId: AdspId,
  chat: Pick<SpecialistChat, 'id'> | undefined,
  metadata: Record<string, unknown>,
): AuditRecordDetails {
  return toDetails(user, tenantId, chat ? { type: SPECIALIST_CHAT_RESOURCE_TYPE, id: chat.id } : undefined, metadata);
}

const withoutSource = ({ source: _source, ...pattern }: BusinessPattern): Record<string, unknown> => pattern;

/**
 * Builds the change set of a pattern update with only the fields that changed. A change set over the audit service
 * size limit is omitted and flagged in the metadata instead, so the record is still accepted.
 */
export function toPatternChangeSet(
  before: BusinessPattern,
  after: BusinessPattern,
): { changeSet?: AuditChangeSet; changeSetOmitted?: true } {
  const previous = withoutSource(before);
  const current = withoutSource(after);
  const changed = [...new Set([...Object.keys(previous), ...Object.keys(current)])].filter(
    (key) => JSON.stringify(previous[key]) !== JSON.stringify(current[key]),
  );
  const pick = (value: Record<string, unknown>) =>
    Object.fromEntries(changed.filter((key) => key in value).map((key) => [key, value[key]]));
  const changeSet = { before: pick(previous), after: pick(current) };
  return Buffer.byteLength(JSON.stringify(changeSet), 'utf8') <= MAX_JSON_FIELD_BYTES
    ? { changeSet }
    : { changeSetOmitted: true };
}

export type PlannerAuditRecorder = (action: AuditAction, details: AuditRecordDetails) => void;

/**
 * Creates a recorder that sends an audit record without blocking or failing the operation. The SDK logs records that
 * are not stored and documents that record() never rejects; a rejection is still caught so it can't become an
 * unhandled rejection.
 */
export function createAuditRecorder(auditService: AuditService, logger: Logger): PlannerAuditRecorder {
  return (action, details) => {
    Promise.resolve(auditService.record(action, details)).catch((err) =>
      logger.warn(`Failed to record audit event ${action.name}: ${err}`, { context: 'PlannerAudit' }),
    );
  };
}

/**
 * Records planner.solution.admin-accessed when a planner admin successfully acts on a solution owned by another
 * user. Use after the middleware that loads the solution; the record is sent once the response succeeds.
 */
export const auditAdminAccess =
  (recordAudit: PlannerAuditRecorder, operation: AdminAccessOperation): RequestHandler =>
  (req, res, next) => {
    const solution = loaded(req);
    if (solution && solution.createdById !== req.user.id && isPlannerAdmin(req.user, solution.tenantId)) {
      const details = toSolutionAuditDetails(req.user, solution, { ownerId: solution.createdById, operation });
      res.once('finish', () => {
        if (res.statusCode < 400) {
          recordAudit(SolutionAdminAccessedAuditAction, details);
        }
      });
    }
    next();
  };

export interface AnalyzedAuditMetadata {
  endpoint: AnalyzedEndpoint;
  mode: AnalysisMode;
  model: string | null;
  fellBack: boolean;
  service?: string;
}
