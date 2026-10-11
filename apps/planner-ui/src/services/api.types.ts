/**
 * api.types.ts — TypeScript types derived from the ADSP Planner Service OpenAPI spec.
 *
 * These types mirror the OpenAPI response schemas from openapi.yaml.
 * Field names are camelCase per the JSON serialisation layer (Mongoose lean + toJSON transform).
 *
 * Classification: Protected B (GoA deliberative process content per ATIA s.23).
 */

// ──────────────────────────────────────────────────────────────────────────────
// Enums
// ──────────────────────────────────────────────────────────────────────────────

export type PlanningSessionStatus = 'active' | 'paused' | 'completed' | 'archived';

export type MessageRole = 'user' | 'assistant';

export type HypothesisStatus = 'pending' | 'proposed' | 'draft' | 'accepted' | 'rejected' | 'superseded';

export type ConceptType =
  | 'actor'
  | 'goal'
  | 'activity'
  | 'decision'
  | 'evidence'
  | 'business_rule'
  | 'constraint'
  | 'evaluation_criteria'
  | 'workflow'
  | 'outcome'
  | 'document'
  | 'event'
  | 'external_system'
  | 'assumption'
  | 'unknown'
  | 'process'
  | 'system'
  | 'other';

export type PatternStatus = 'active' | 'inactive';

export type AuditOutcome = 'success' | 'failure';

// ──────────────────────────────────────────────────────────────────────────────
// Core entities
// ──────────────────────────────────────────────────────────────────────────────

export interface PlanningSession {
  id: string;
  /** Protected B — never render in UI; used for server-side scoping only */
  userId: string;
  /** Protected B — never render in UI; used for server-side scoping only */
  tenantId: string;
  title: string;
  status: PlanningSessionStatus;
  businessModelId?: string;
  businessProblemSummary?: string;
  createdAt: string;
  updatedAt: string;
  lastResumedAt?: string;
  archivedAt?: string;
}

export interface ConversationMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  /** Protected B — store in React state only; no localStorage/sessionStorage */
  content: string;
  createdAt: string;
  integrationStubbed?: boolean;
}

export interface BusinessConcept {
  id: string;
  businessModelId: string;
  name: string;
  description?: string;
  conceptType: ConceptType;
  /** Protected B — source text from conversation */
  sourceText?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessModel {
  id: string;
  sessionId: string;
  confidenceScore: number;
  concepts: BusinessConcept[];
  /** Protected B deliberative content */
  problemSummary?: string;
  extractedAt?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SolutionHypothesis {
  id: string;
  sessionId: string;
  businessModelId: string;
  /** Protected B deliberative content */
  summary: string;
  /** Protected B deliberative content */
  reasoning?: string;
  status: HypothesisStatus;
  patternId?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdspServiceMapping {
  serviceName: string;
  useCase: string;
}

export interface BusinessPattern {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  status: PatternStatus;
  keywords?: string[];
  serviceAffinity?: string[];
  matchThreshold: number;
  matchCount: number;
  lastModified: string;
  createdAt: string;
  // Rich content fields
  applicationType?: string;
  purpose?: string;
  commonDomainLanguage?: string[];
  commonFeatures?: string[];
  strongConfidenceSignals?: string[];
  weakSignals?: string[];
  adspServiceMappings?: AdspServiceMapping[];
  clarifyingQuestions?: string[];
  commonAssumptions?: string[];
  knownUnknowns?: string[];
}

export interface AuditEvent {
  id: string;
  tenantId: string;
  /** Protected A — never render raw; display as actorDisplayName */
  actorId: string;
  actionLabel: string;
  resourceType: string;
  resourceId: string;
  outcome: AuditOutcome;
  hmacHash?: string;
  occurredAt: string;
}

export interface User {
  id: string;
  /** Protected A — render masked to planner-admin; full to tenant-admin */
  email: string;
  displayName?: string;
  roles: string[];
  status: 'active' | 'inactive';
  lastActivityAt?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Pagination
// ──────────────────────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// Request bodies
// ──────────────────────────────────────────────────────────────────────────────

export interface CreateSessionRequest {
  title: string;
}

export interface UpdateSessionRequest {
  status?: PlanningSessionStatus;
  title?: string;
}

export interface SendMessageRequest {
  content: string;
}

export interface UpdateBusinessModelRequest {
  conceptUpdates: Array<{
    conceptId: string;
    conceptType: ConceptType;
  }>;
}

export interface UpdateHypothesisStatusRequest {
  status: 'accepted' | 'rejected';
}

export interface CreatePatternRequest {
  name: string;
  description?: string;
  status: PatternStatus;
  keywords?: string[];
  serviceAffinity?: string[];
  matchThreshold: number;
}

export interface CreateUserRequest {
  email: string;
  displayName?: string;
  role: string;
}

export interface UpdateUserRequest {
  role?: string;
  status?: 'active' | 'inactive';
}

// ──────────────────────────────────────────────────────────────────────────────
// Export
// ──────────────────────────────────────────────────────────────────────────────

export interface SessionExport {
  id: string;
  sessionId: string;
  format: 'json';
  status: 'pending' | 'ready' | 'failed';
  downloadUrl?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface CreateExportRequest {
  format: 'json';
}

// ──────────────────────────────────────────────────────────────────────────────
// Audit chain verification
// ──────────────────────────────────────────────────────────────────────────────

export interface AuditChainVerification {
  verified: boolean;
  checkedAt: string;
  totalEvents: number;
  brokenAtEventId?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Specialist consultations (operationIds: consultSpecialist, getSpecialistRequest)
// ──────────────────────────────────────────────────────────────────────────────

export interface ConsultSpecialistRequest {
  specialistType: 'form-service' | 'pdf-service' | 'comment-service' | 'notification-service';
  /** Context payload for the specialist — Protected B; contains session excerpts */
  requestPayload: Record<string, unknown>;
}

export type SpecialistRequestStatus = 'pending' | 'sent' | 'completed' | 'failed';

export interface SpecialistRequest {
  requestId: string;
  sessionId: string;
  tenantId: string;
  specialistType: string;
  /** Protected B — requestPayload contains session context excerpts */
  requestPayload: Record<string, unknown>;
  status: SpecialistRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SpecialistResponse {
  responseId: string;
  requestId: string;
  sessionId: string;
  tenantId: string;
  /** Protected B — responsePayload contains specialist analysis */
  responsePayload: Record<string, unknown>;
  receivedAt: string;
}

export interface SpecialistRequestWithResponse extends SpecialistRequest {
  response?: SpecialistResponse;
}

// ──────────────────────────────────────────────────────────────────────────────
// Specialist direct chat (multi-turn interactive mode)
// ──────────────────────────────────────────────────────────────────────────────

export interface SpecialistDirectMessage {
  id: string;
  role: 'user' | 'assistant';
  /** Protected B — contains user questions and specialist responses */
  content: string;
  createdAt: string;
}

export interface SendSpecialistMessageResponse {
  userMessage: SpecialistDirectMessage;
  assistantMessage: SpecialistDirectMessage;
}

// ──────────────────────────────────────────────────────────────────────────────
// User context (operationIds: getCurrentUserContext, getUserById, listUsers)
// Mirrors OpenAPI UserContext schema — separate from the existing User type.
// ──────────────────────────────────────────────────────────────────────────────

export interface UserContext {
  contextId: string;
  /** Protected A — Keycloak sub claim (POPA s.17) */
  userId: string;
  tenantId: string;
  preferences?: Record<string, unknown>;
  lastActiveSessionId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Inline response type for GET /users/me (operationId: getCurrentUserContext).
 * Returns the authenticated user's own profile and planner-service role context.
 */
export interface CurrentUserContext {
  /** Keycloak user sub claim — Protected A (POPA s.17) */
  userId: string;
  tenantId: string;
  roles: string[];
  email?: string;
  displayName?: string;
}
