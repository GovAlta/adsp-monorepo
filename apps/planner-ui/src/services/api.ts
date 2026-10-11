/// <reference types="vite/client" />
/**
 * api.ts — ADSP Planner UI API Service Layer
 *
 * All requests are authenticated via JWT/Keycloak OIDC.
 * ✓ ASVS:V-9.1.1 — API_BASE_URL sourced from environment; token from Keycloak context.
 *
 * FAC-S5-017 — API_BASE_URL is sourced from import.meta.env, NEVER hardcoded.
 * FAC-S5-018 — Auth header attached via authHeader() helper; no credential in source.
 * FAC-S5-026 — No Protected B data written to localStorage/sessionStorage in this module.
 */

import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import type {
  PlanningSession,
  PlanningSessionStatus,
  ConversationMessage,
  BusinessModel,
  SolutionHypothesis,
  BusinessPattern,
  AuditEvent,
  AuditChainVerification,
  User,
  SessionExport,
  PaginatedResult,
  CreateSessionRequest,
  UpdateSessionRequest,
  SendMessageRequest,
  UpdateBusinessModelRequest,
  UpdateHypothesisStatusRequest,
  CreatePatternRequest,
  CreateUserRequest,
  UpdateUserRequest,
  CreateExportRequest,
  SpecialistRequestWithResponse,
  UserContext,
  CurrentUserContext,
} from './api.types';

// ──────────────────────────────────────────────────────────────────────────────
// Configuration — NEVER hardcode base URL or credentials
// ──────────────────────────────────────────────────────────────────────────────

// ✓ ASVS:V-9.1.1 — base URL sourced from environment variable, not hardcoded
const BASE_URL: string = import.meta.env.VITE_API_BASE_URL as string;

if (!BASE_URL && import.meta.env.MODE !== 'test') {
  console.warn('[api] VITE_API_BASE_URL is not set — API calls will fail');
}

// ──────────────────────────────────────────────────────────────────────────────
// Auth header helper
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Returns the current Keycloak JWT as an Authorization header object.
 * Token is sourced from the Keycloak adapter (window.__keycloak) — never from localStorage.
 * ✓ ASVS:V-9.1.1 — token from Keycloak context, not browser storage
 * ✓ CAS:RULE-017 — no Protected B credentials stored client-side
 */
function authHeader(): Record<string, string> {
  // Keycloak adapter exposes the current token on window.__keycloak.token
  // The planner-ui Keycloak adapter is initialised in main.tsx before rendering.
  const keycloak = (window as unknown as { __keycloak?: { token?: string } }).__keycloak;
  const token = keycloak?.token ?? '';
  // ✓ ASVS:V-9.1.1 — token passed as Authorization header only; NOT written to localStorage
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ──────────────────────────────────────────────────────────────────────────────
// Axios instance
// ──────────────────────────────────────────────────────────────────────────────

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // TLS enforced at the infrastructure level; axios does not need explicit config for HTTPS
});

// Attach auth header on every request
axiosInstance.interceptors.request.use((config) => {
  Object.assign(config.headers, authHeader());
  return config;
});

// ──────────────────────────────────────────────────────────────────────────────
// Generic request helper
// ──────────────────────────────────────────────────────────────────────────────

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await axiosInstance.request<T>(config);
  return response.data;
}

// ──────────────────────────────────────────────────────────────────────────────
// Sessions
// ──────────────────────────────────────────────────────────────────────────────

async function listSessions(params?: {
  page?: number;
  pageSize?: number;
  status?: PlanningSessionStatus;
}): Promise<PaginatedResult<PlanningSession>> {
  return request<PaginatedResult<PlanningSession>>({
    method: 'GET',
    url: '/sessions',
    // FAC-S5-024: query params contain only pagination/filter — no Protected B field values
    params: {
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
      ...(params?.status ? { status: params.status } : {}),
    },
  });
}

async function createSession(body: CreateSessionRequest): Promise<PlanningSession> {
  // FAC-S5-024: title submitted in POST body, not URL query string
  return request<PlanningSession>({ method: 'POST', url: '/sessions', data: body });
}

async function getSession(sessionId: string): Promise<PlanningSession> {
  return request<PlanningSession>({ method: 'GET', url: `/sessions/${sessionId}` });
}

async function updateSession(
  sessionId: string,
  body: UpdateSessionRequest
): Promise<PlanningSession> {
  return request<PlanningSession>({
    method: 'PATCH',
    url: `/sessions/${sessionId}`,
    data: body,
  });
}

async function archiveSession(sessionId: string): Promise<void> {
  return request<void>({ method: 'DELETE', url: `/sessions/${sessionId}` });
}

// ──────────────────────────────────────────────────────────────────────────────
// Messages
// ──────────────────────────────────────────────────────────────────────────────

async function listMessages(
  sessionId: string,
  params?: { page?: number; pageSize?: number }
): Promise<PaginatedResult<ConversationMessage>> {
  return request<PaginatedResult<ConversationMessage>>({
    method: 'GET',
    url: `/sessions/${sessionId}/messages`,
    params: { page: params?.page ?? 1, pageSize: params?.pageSize ?? 50 },
  });
}

async function sendMessage(
  sessionId: string,
  body: SendMessageRequest
): Promise<ConversationMessage> {
  // FAC-S5-024: message content in POST body, NOT URL query string
  // ✓ ASVS:V-8.3.1: content passed through service layer only; no localStorage write
  return request<ConversationMessage>({
    method: 'POST',
    url: `/sessions/${sessionId}/messages`,
    data: body,
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Business model
// ──────────────────────────────────────────────────────────────────────────────

async function getBusinessModel(sessionId: string): Promise<BusinessModel | null> {
  try {
    return await request<BusinessModel>({ method: 'GET', url: `/sessions/${sessionId}/model` });
  } catch (err: unknown) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

async function updateBusinessModel(
  sessionId: string,
  body: UpdateBusinessModelRequest
): Promise<BusinessModel> {
  return request<BusinessModel>({
    method: 'PATCH',
    url: `/sessions/${sessionId}/model`,
    data: body,
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Hypotheses
// ──────────────────────────────────────────────────────────────────────────────

async function listHypotheses(sessionId: string): Promise<PaginatedResult<SolutionHypothesis>> {
  return request<PaginatedResult<SolutionHypothesis>>({
    method: 'GET',
    url: `/sessions/${sessionId}/hypotheses`,
  });
}

/**
 * Get a specific solution hypothesis.
 * @operationId getHypothesis
 * GET /sessions/{sessionId}/hypotheses/{hypothesisId}
 */
async function getHypothesis(
  sessionId: string,
  hypothesisId: string
): Promise<SolutionHypothesis> {
  return request<SolutionHypothesis>({
    method: 'GET',
    url: `/sessions/${sessionId}/hypotheses/${hypothesisId}`,
  });
}

async function updateHypothesisStatus(
  sessionId: string,
  hypothesisId: string,
  body: UpdateHypothesisStatusRequest
): Promise<SolutionHypothesis> {
  return request<SolutionHypothesis>({
    method: 'PATCH',
    url: `/sessions/${sessionId}/hypotheses/${hypothesisId}`,
    data: body,
  });
}

async function generateHypothesis(sessionId: string): Promise<SolutionHypothesis> {
  return request<SolutionHypothesis>({
    method: 'POST',
    url: `/sessions/${sessionId}/hypotheses/generate`,
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Specialists
// ──────────────────────────────────────────────────────────────────────────────

async function consultSpecialist(
  sessionId: string,
  body: { serviceId: string }
): Promise<void> {
  return request<void>({
    method: 'POST',
    url: `/sessions/${sessionId}/specialists`,
    data: body,
  });
}

/**
 * Get a specialist request and its response.
 * @operationId getSpecialistRequest
 * GET /sessions/{sessionId}/specialists/{requestId}
 */
async function getSpecialistRequest(
  sessionId: string,
  requestId: string
): Promise<SpecialistRequestWithResponse> {
  return request<SpecialistRequestWithResponse>({
    method: 'GET',
    url: `/sessions/${sessionId}/specialists/${requestId}`,
  });
}

// Aliases used by PlanningSession.tsx
async function requestSpecialistConsultation(
  sessionId: string,
  body: { specialistType: string }
): Promise<{ id: string; status: string }> {
  return request<{ id: string; status: string }>({
    method: 'POST',
    url: `/sessions/${sessionId}/specialists`,
    data: body,
  });
}

async function getSpecialistResponse(
  sessionId: string,
  requestId: string
): Promise<{ id: string; status: string; response: string | null }> {
  return request<{ id: string; status: string; response: string | null }>({
    method: 'GET',
    url: `/sessions/${sessionId}/specialists/${requestId}`,
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Patterns
// ──────────────────────────────────────────────────────────────────────────────

async function listPatterns(params?: {
  page?: number;
  pageSize?: number;
  status?: 'active' | 'inactive';
  name?: string;
}): Promise<PaginatedResult<BusinessPattern>> {
  return request<PaginatedResult<BusinessPattern>>({
    method: 'GET',
    url: '/patterns',
    params: {
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
      ...(params?.status ? { status: params.status } : {}),
      ...(params?.name ? { name: params.name } : {}),
    },
  });
}

async function getPattern(patternId: string): Promise<BusinessPattern> {
  return request<BusinessPattern>({ method: 'GET', url: `/patterns/${patternId}` });
}

async function createPattern(body: CreatePatternRequest): Promise<BusinessPattern> {
  return request<BusinessPattern>({ method: 'POST', url: '/patterns', data: body });
}

async function updatePattern(
  patternId: string,
  body: Partial<CreatePatternRequest>
): Promise<BusinessPattern> {
  return request<BusinessPattern>({ method: 'PUT', url: `/patterns/${patternId}`, data: body });
}

async function deactivatePattern(patternId: string): Promise<BusinessPattern> {
  return request<BusinessPattern>({
    method: 'PUT',
    url: `/patterns/${patternId}/deactivate`,
  });
}

/**
 * Delete (hard-delete) a business pattern.
 * Requires planner-admin or tenant-admin role (BR-007).
 * @operationId deletePattern
 * DELETE /patterns/{patternId}
 */
async function deletePattern(patternId: string): Promise<void> {
  return request<void>({ method: 'DELETE', url: `/patterns/${patternId}` });
}

// ──────────────────────────────────────────────────────────────────────────────
// Exports
// ──────────────────────────────────────────────────────────────────────────────

async function listExports(sessionId: string): Promise<PaginatedResult<SessionExport>> {
  return request<PaginatedResult<SessionExport>>({
    method: 'GET',
    url: `/sessions/${sessionId}/exports`,
  });
}

async function initiateExport(
  sessionId: string,
  body: CreateExportRequest
): Promise<SessionExport> {
  return request<SessionExport>({
    method: 'POST',
    url: `/sessions/${sessionId}/exports`,
    data: body,
  });
}

async function getExport(sessionId: string, exportId: string): Promise<SessionExport> {
  return request<SessionExport>({
    method: 'GET',
    url: `/sessions/${sessionId}/exports/${exportId}`,
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Audit
// ──────────────────────────────────────────────────────────────────────────────

async function listAuditEvents(params?: {
  page?: number;
  pageSize?: number;
  resourceType?: string;
  actorId?: string;
  since?: string;
  until?: string;
}): Promise<PaginatedResult<AuditEvent>> {
  return request<PaginatedResult<AuditEvent>>({
    method: 'GET',
    url: '/audit',
    params: {
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 25,
      ...(params?.resourceType ? { resourceType: params.resourceType } : {}),
      // FAC-S5-024: actorId is Protected A per OpenAPI — standard query param per spec
      ...(params?.actorId ? { actorId: params.actorId } : {}),
      ...(params?.since ? { since: params.since } : {}),
      ...(params?.until ? { until: params.until } : {}),
    },
  });
}

async function verifyAuditChain(): Promise<AuditChainVerification> {
  return request<AuditChainVerification>({ method: 'GET', url: '/audit/verify' });
}

/**
 * Get a single audit event by ID.
 * Requires planner-admin+ (BR-007).
 * @operationId getAuditEvent
 * GET /audit/{eventId}
 */
async function getAuditEvent(eventId: string): Promise<AuditEvent> {
  return request<AuditEvent>({ method: 'GET', url: `/audit/${eventId}` });
}

// ──────────────────────────────────────────────────────────────────────────────
// User management
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Get the authenticated user's own profile and planner-service role context.
 * @operationId getCurrentUserContext
 * GET /users/me
 * ✓ ASVS:V-9.1.1 — token from Keycloak context; userId/roles sourced from JWT, not client-supplied
 */
async function getCurrentUserContext(): Promise<CurrentUserContext> {
  // FAC-S5-024: no Protected A fields (userId, email) passed in URL query string
  return request<CurrentUserContext>({ method: 'GET', url: '/users/me' });
}

async function listUsers(params?: {
  page?: number;
  pageSize?: number;
  role?: string;
  status?: 'active' | 'inactive';
}): Promise<PaginatedResult<User>> {
  return request<PaginatedResult<User>>({
    method: 'GET',
    url: '/users',
    params: {
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
      ...(params?.role ? { role: params.role } : {}),
      ...(params?.status ? { status: params.status } : {}),
    },
  });
}

async function createUser(body: CreateUserRequest): Promise<User> {
  // FAC-S5-024: email submitted in POST body, not URL query string
  return request<User>({ method: 'POST', url: '/users', data: body });
}

/**
 * Get a specific user's context record within the current tenant.
 * Requires planner-admin or tenant-admin role.
 * @operationId getUserById
 * GET /users/{userId}
 */
async function getUserById(userId: string): Promise<UserContext> {
  return request<UserContext>({ method: 'GET', url: `/users/${userId}` });
}

async function updateUser(userId: string, body: UpdateUserRequest): Promise<User> {
  return request<User>({ method: 'PATCH', url: `/users/${userId}`, data: body });
}

async function deactivateUser(userId: string): Promise<void> {
  return request<void>({ method: 'DELETE', url: `/users/${userId}` });
}

// ──────────────────────────────────────────────────────────────────────────────
// Exports — named api object (matches import pattern used in pages)
// ──────────────────────────────────────────────────────────────────────────────

export const api = {
  // Sessions
  listSessions,
  createSession,
  getSession,
  updateSession,
  archiveSession,
  // Messages
  listMessages,
  sendMessage,
  // Business model
  getBusinessModel,
  updateBusinessModel,
  // Hypotheses
  listHypotheses,
  getHypothesis,
  updateHypothesisStatus,
  generateHypothesis,
  // Specialists
  consultSpecialist,
  getSpecialistRequest,
  requestSpecialistConsultation,
  getSpecialistResponse,
  // Patterns
  listPatterns,
  getPattern,
  createPattern,
  updatePattern,
  deactivatePattern,
  deletePattern,
  // Exports
  listExports,
  initiateExport,
  getExport,
  // Audit
  listAuditEvents,
  verifyAuditChain,
  getAuditEvent,
  // Users
  getCurrentUserContext,
  listUsers,
  createUser,
  getUserById,
  updateUser,
  deactivateUser,
};

export default api;
