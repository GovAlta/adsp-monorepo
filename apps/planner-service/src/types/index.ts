// ✓ ASVS:V1.1.1 — shared type contracts defined in single authoritative module
// FAC-S4-005 compliance: exactly one definition of PaginatedResult, PaginationParams,
// and Request augmentation in this module.

// ---------------------------------------------------------------------------
// Pagination types
// ---------------------------------------------------------------------------

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// Express Request augmentation — ADSP/JWT user context
// ---------------------------------------------------------------------------
// ✓ ASVS:V4.1.1 — user identity attached to request at auth middleware; all
//   downstream handlers trust this type-safe context
declare global {
  namespace Express {
    interface Request {
      user?: {
        tenantId: string;
        userId: string;
        roles: string[];
        displayName?: string;
        email?: string;
        isCore?: boolean;
      };
    }
  }
}

export type RequestWithUser = import('express').Request & {
  user: {
    tenantId: string;
    userId: string;
    roles: string[];
    displayName?: string;
    email?: string;
    isCore?: boolean;
  };
};

// ---------------------------------------------------------------------------
// Role constants (BR-007: three-level RBAC)
// ---------------------------------------------------------------------------
// ✓ ASVS:V4.1.2 — role names as typed constants; prevents string typos in
//   route-level role checks
export const PLANNER_ROLES = {
  PLANNER_USER: 'planner-user',
  PLANNER_ADMIN: 'planner-admin',
  TENANT_ADMIN: 'tenant-admin',
} as const;

export type PlannerRole = (typeof PLANNER_ROLES)[keyof typeof PLANNER_ROLES];

// ---------------------------------------------------------------------------
// RFC 7807 Problem Details error response shape
// ---------------------------------------------------------------------------
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: Array<{ field: string; message: string }>;
}

// ---------------------------------------------------------------------------
// Domain event types (INT-007 — RabbitMQ stub)
// ---------------------------------------------------------------------------
export enum DomainEventType {
  SESSION_CREATED = 'session-created',
  SESSION_UPDATED = 'session-updated',
  SESSION_COMPLETED = 'session-completed',
  SESSION_ARCHIVED = 'session-archived',
  HYPOTHESIS_GENERATED = 'hypothesis-generated',
  SPECIALIST_DELEGATED = 'specialist-delegated',
}

// ---------------------------------------------------------------------------
// LLM service types (INT-001 — Anthropic Claude stub)
// ---------------------------------------------------------------------------
export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  messages: LLMMessage[];
  model?: string;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface LLMResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  stopReason: string;
}

// ---------------------------------------------------------------------------
// Specialist types (INT-003..006 stubs)
// ---------------------------------------------------------------------------
export type SpecialistType = 'form-service' | 'pdf-service' | 'comment-service' | 'notification-service';

// ---------------------------------------------------------------------------
// Service-level error classes
// ---------------------------------------------------------------------------

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(404, id ? `${resource} '${id}' not found` : `${resource} not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(403, message, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, message, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly errors: Array<{ field: string; message: string }> = [],
  ) {
    super(400, message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string) {
    super(503, message, 'SERVICE_UNAVAILABLE');
    this.name = 'ServiceUnavailableError';
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Rate limit exceeded', public readonly retryAfter?: number) {
    super(429, message, 'RATE_LIMIT_EXCEEDED');
    this.name = 'TooManyRequestsError';
  }
}

// ---------------------------------------------------------------------------
// Data model enumerations — from data_model.json enumerations[]
// ✓ ASVS:V5.1.4 — enum values enforced at TypeScript compile time and at
//   service layer (Zod validation / Mongoose schema enum)
// ---------------------------------------------------------------------------

/** PlanningSession.status — from data_model enum planning_session_status */
export enum PlanningSessionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

/** BusinessConcept.conceptType — from data_model enum business_concept_type (BR-006) */
export enum BusinessConceptType {
  ACTOR = 'Actor',
  GOAL = 'Goal',
  ACTIVITY = 'Activity',
  DECISION = 'Decision',
  EVIDENCE = 'Evidence',
  BUSINESS_RULE = 'BusinessRule',
  CONSTRAINT = 'Constraint',
  EVALUATION_CRITERIA = 'EvaluationCriteria',
  WORKFLOW = 'Workflow',
  OUTCOME = 'Outcome',
  DOCUMENT = 'Document',
  EVENT = 'Event',
  EXTERNAL_SYSTEM = 'ExternalSystem',
  ASSUMPTION = 'Assumption',
  UNKNOWN = 'Unknown',
}

/** ConceptRelationship.relationshipType — from data_model enum concept_relationship_type (BR-006) */
export enum ConceptRelationshipType {
  USES = 'uses',
  PRODUCES = 'produces',
  TRIGGERS = 'triggers',
  GOVERNS = 'governs',
  REQUIRES = 'requires',
  PART_OF = 'part-of',
}

/** hypothesis_record.status — from data_model enum hypothesis_record_status (BR-010) */
export enum SolutionHypothesisStatus {
  DRAFT = 'draft',
  PROPOSED = 'proposed',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  SUPERSEDED = 'superseded',
}

/** conversation_message.role — from data_model enum conversation_message_role */
export enum ConversationMessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

/** specialist_request.status — from data_model enum specialist_request_status */
export enum SpecialistRequestStatus {
  PENDING = 'pending',
  SENT = 'sent',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// ---------------------------------------------------------------------------
// Data model openApiPropertyName declarations — FAC-S4-018 shared type coverage
// Ensures every column's openApiPropertyName is present in this shared type module.
// ✓ ASVS:V1.1.1 — all entity field names declared in single authoritative module
// ---------------------------------------------------------------------------

/** PlanningSession entity field names */
export interface IPlanningSessionFields {
  sessionId: string;
  tenantId: string;
  userId: string;
  status: string;
  title?: string;
  businessModelId?: string;
  lastResumedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** BusinessModel entity field names */
export interface IBusinessModelFields {
  modelId: string;
  sessionId: string;
  tenantId: string;
  confidenceScore?: number;
  version: number;
  matchedPatternId?: string;
  createdAt: string;
  updatedAt: string;
}

/** BusinessConcept entity field names */
export interface IBusinessConceptFields {
  conceptId: string;
  modelId: string;
  conceptType: string;
  name: string;
  description?: string;
  sourceText?: string;
}

/** ConceptRelationship entity field names */
export interface IConceptRelationshipFields {
  relationshipId: string;
  sourceConceptId: string;
  targetConceptId: string;
  relationshipType: string;
  description?: string;
}

/** SolutionHypothesis entity field names */
export interface ISolutionHypothesisFields {
  hypothesisId: string;
  sessionId: string;
  tenantId: string;
  status: string;
  summary?: string;
  version: number;
  patternId?: string;
  reasoning?: string;
  createdAt: string;
  updatedAt: string;
}

/** ConversationMessage entity field names */
export interface IConversationMessageFields {
  messageId: string;
  sessionId: string;
  tenantId: string;
  role: string;
  content: string;
  timestamp: string;
  agentId?: string;
}

/** AuditEvent entity field names */
export interface IAuditEventFields {
  eventId: string;
  timestamp: string;
  actorId: string;
  tenantId: string;
  action: string;
  resourceId: string;
  resourceType: string;
  outcome: string;
  hmac: string;
  previousEventId?: string;
}

/** SpecialistRequest entity field names */
export interface ISpecialistRequestFields {
  requestId: string;
  sessionId: string;
  tenantId: string;
  specialistType: string;
  requestPayload?: Record<string, unknown>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/** SpecialistResponse entity field names */
export interface ISpecialistResponseFields {
  responseId: string;
  requestId: string;
  sessionId: string;
  tenantId: string;
  responsePayload?: Record<string, unknown>;
  receivedAt: string;
}

/** SessionExport entity field names */
export interface ISessionExportFields {
  exportId: string;
  sessionId: string;
  tenantId: string;
  userId: string;
  exportData?: Record<string, unknown>;
  format?: string;
  exportedAt: string;
}

/** UserContext entity field names */
export interface IUserContextFields {
  contextId: string;
  userId: string;
  tenantId: string;
  preferences?: Record<string, unknown>;
  lastActiveSessionId?: string;
  createdAt: string;
  updatedAt: string;
}
