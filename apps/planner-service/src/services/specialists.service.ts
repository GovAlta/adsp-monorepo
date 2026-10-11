// [IMPL-DEFERRED: INT-002] — specialist enablement check via ADSP Configuration Service
// isSpecialistEnabled always returns false until INT-002 is provisioned (OPEN-004).
// OPEN-004: SpecialistAgentConfig entity provisioning in target tenant environments unconfirmed.
//
// [IMPL-DEFERRED: INT-003..006] — specialist agents (form, pdf, comment, notification) are stubs
// callSpecialistStub always throws ServiceUnavailableError; replaced when INT-003..006 are enabled.
//
// X-Integration-Stubbed: INT-002,INT-003,INT-004,INT-005,INT-006
// Implementation status: fail-closed stub (isEnabled always false; stub agent always throws)

import * as crypto from 'crypto';
import { Logger } from 'winston';
import { ForbiddenError, ServiceUnavailableError, SpecialistType } from '../types';
import {
  SpecialistRequestModel,
  ISpecialistRequestDocument,
  SpecialistRequestStatus,
} from '../mongo/schemas/specialist-request.schema';
import {
  SpecialistResponseModel,
  ISpecialistResponseDocument,
} from '../mongo/schemas/specialist-response.schema';

// ✓ ASVS:V1.6.1 — specialist agent stubs INT-003..006 are fail-closed
// ✓ CAS:RULE-028 — specialist delegation tracked in specialist_request entity
// ✓ ASVS:V4.1.1 — tenantId enforced on all Mongoose query predicates
// ✓ ASVS:V5.1.4 — specialistType constrained to SpecialistType union; validated at route layer

// ---------------------------------------------------------------------------
// Valid specialist types (BR-009 / SpecialistAgentConfig entity)
// ✓ ASVS:V5.1.4 — enum matches SpecialistType union from types module
// ---------------------------------------------------------------------------
export const VALID_SPECIALIST_TYPES: SpecialistType[] = [
  'form-service',
  'pdf-service',
  'comment-service',
  'notification-service',
];

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface ConsultSpecialistInput {
  sessionId: string;
  tenantId: string;
  specialistType: SpecialistType;
  requestPayload: Record<string, unknown>;
  userId: string;
}

export type SpecialistRequestWithResponse = ISpecialistRequestDocument & {
  response?: ISpecialistResponseDocument;
};

// ---------------------------------------------------------------------------
// SpecialistsService
// ---------------------------------------------------------------------------

/**
 * SpecialistsService — manages specialist delegation lifecycle for planning sessions.
 * All operations are scoped to (tenantId, sessionId).
 *
 * UC-005: Consult Specialist Agent
 * BR-009: specialist must be enabled in SpecialistAgentConfig
 * INT-002: ADSP Configuration Service (stub — always returns false for isEnabled)
 * INT-003..006: specialist agents (stub — always throw 503)
 */
export class SpecialistsService {
  constructor(private readonly logger: Logger) {}

  /**
   * isSpecialistEnabled — checks whether a specialist is enabled for the tenant.
   *
   * [IMPL-DEFERRED: INT-002] — stub: always returns false
   * BR-009: SpecialistAgentConfig.isEnabled must be true for delegation to proceed.
   * Replace stub body with live ConfigService.getSpecialistConfig() call when INT-002 is enabled.
   *
   * ✓ ASVS:V1.6.1 — fail-closed: returns false when config service unavailable
   * ✓ CAS:RULE-028 — BR-009 enforced; specialists not enabled without explicit config
   */
  async isSpecialistEnabled(
    _tenantId: string,
    specialistType: SpecialistType,
  ): Promise<boolean> {
    // [IMPL-DEFERRED: INT-002] — no live Config Service call; always returns false
    // ✓ ASVS:V1.6.1 — fail-closed: returns false when config service unavailable
    this.logger.debug(
      '[INT-002 STUB] isSpecialistEnabled check — config service unavailable, returning false',
      { specialistType },
    );
    return false;
  }

  /**
   * callSpecialistStub — placeholder for INT-003..006 specialist agent calls.
   *
   * [IMPL-DEFERRED: INT-003..006] — always throws ServiceUnavailableError.
   * Replace with ADSP specialist SDK calls (form/pdf/comment/notification) when enabled.
   *
   * ✓ ASVS:V1.6.1 — fail-closed; stub cannot return a success response
   */
  private async callSpecialistStub(
    specialistType: SpecialistType,
    _payload: Record<string, unknown>,
  ): Promise<never> {
    // [IMPL-DEFERRED: INT-003..006] — stub: always fail-closed
    // ✓ ASVS:V1.6.1 — specialist agent call fails closed until integration is enabled
    this.logger.warn(
      '[INT-xxx STUB] Specialist agent call intercepted by stub — returning 503',
      { specialistType },
    );
    throw new ServiceUnavailableError(
      `[IMPL-DEFERRED: INT-003..006] Specialist agent '${specialistType}' is not yet integrated. ` +
        `Integration with the ${specialistType} specialist agent is pending implementation.`,
    );
  }

  /**
   * consultSpecialist — delegates a task to a specialist agent.
   *
   * Current stub behavior (INT-002 not provisioned):
   *   Step 1: isSpecialistEnabled → false (INT-002 stub) → throws ForbiddenError (HTTP 403)
   *
   * Future behavior (INT-002 + INT-003..006 enabled):
   *   Step 1: isSpecialistEnabled → true
   *   Step 2: Create SpecialistRequest (status='pending')
   *   Step 3: callSpecialistStub → throws 503 (INT-003..006 still stub)
   *   Step 4: Persist SpecialistResponse (stub error)
   *   Step 5: Update SpecialistRequest.status = 'failed'
   *   Step 6: Return SpecialistRequest + SpecialistResponse
   *
   * ✓ ASVS:V1.6.1 — fail-closed at two layers: isEnabled=false and stub agent
   * ✓ CAS:RULE-028 — specialist delegation tracked; requestPayload not logged
   * ✓ ASVS:V4.1.1 — tenantId + sessionId in all predicate writes
   */
  async consultSpecialist(input: ConsultSpecialistInput): Promise<SpecialistRequestWithResponse> {
    const { tenantId, sessionId, specialistType, requestPayload } = input;

    // BR-009: specialist must be enabled in SpecialistAgentConfig
    // [IMPL-DEFERRED: INT-002] — always returns false in stub mode → 403
    // ✓ ASVS:V4.1.2 — disabled specialists rejected; not silently degraded
    const isEnabled = await this.isSpecialistEnabled(tenantId, specialistType);
    if (!isEnabled) {
      throw new ForbiddenError(
        `Specialist ${specialistType} is not enabled for this tenant`,
      );
    }

    // Create SpecialistRequest with status='pending'
    // ✓ CAS:RULE-028 — specialist delegation tracked in specialist_request entity
    const requestId = crypto.randomUUID();
    const request = new SpecialistRequestModel({
      requestId,
      sessionId,
      tenantId,
      specialistType,
      requestPayload,
      status: 'pending' as SpecialistRequestStatus,
    });
    await request.save();

    // ✓ ASVS:V7.2.1 — logged with IDs only; requestPayload (Protected B) not logged
    this.logger.info('SpecialistRequest created', {
      requestId,
      sessionId,
      tenantId,
      specialistType,
      status: 'pending',
    });

    // Call specialist stub (INT-003..006) — always throws 503 in current state
    let finalStatus: SpecialistRequestStatus = 'failed';
    let response: ISpecialistResponseDocument | undefined;

    try {
      // ✓ ASVS:V1.6.1 — stub call; INT-003..006 are fail-closed
      await this.callSpecialistStub(specialistType, requestPayload);
      // Unreachable until INT-003..006 are enabled:
      finalStatus = 'completed';
    } catch (stubErr) {
      // Expected in current stub state — persist a failed response record
      const responseId = crypto.randomUUID();
      response = new SpecialistResponseModel({
        responseId,
        requestId,
        sessionId,
        tenantId,
        responsePayload: {
          stub: true,
          // ✓ ASVS:V7.1.1 — stub error message only; no Protected B content in payload
          error: stubErr instanceof Error ? stubErr.message : String(stubErr),
        },
        receivedAt: new Date(),
      });
      await response.save();
      finalStatus = 'failed';
    }

    // Update SpecialistRequest status (pending → failed in stub mode)
    request.status = finalStatus;
    await request.save();

    this.logger.info('SpecialistRequest resolved', {
      requestId,
      sessionId,
      tenantId,
      specialistType,
      status: finalStatus,
    });

    // Return SpecialistRequest with stub response attached
    const result = request.toObject() as SpecialistRequestWithResponse;
    if (response) {
      result.response = response.toObject() as ISpecialistResponseDocument;
    }
    return result;
  }

  /**
   * getSpecialistRequest — retrieves a SpecialistRequest with its linked SpecialistResponse.
   * Multi-tenant: requires (tenantId, sessionId, requestId) match.
   *
   * Returns null when not found within the tenant+session boundary.
   *
   * ✓ ASVS:V4.1.1 — three-key lookup (tenantId+sessionId+requestId); no cross-tenant access
   * ✓ CAS:RULE-015 — tenantId enforced in predicate; records not visible across tenants
   */
  async getSpecialistRequest(
    tenantId: string,
    sessionId: string,
    requestId: string,
  ): Promise<SpecialistRequestWithResponse | null> {
    // ✓ ASVS:V4.1.1 — all three keys in predicate
    const request = await SpecialistRequestModel.findOne({
      requestId,
      tenantId,
      sessionId,
    })
      .lean<ISpecialistRequestDocument>()
      .exec();

    if (!request) {
      return null;
    }

    // Fetch linked response if present
    // ✓ ASVS:V4.1.1 — tenantId in predicate; no cross-tenant response access
    const response = await SpecialistResponseModel.findOne({ requestId, tenantId })
      .lean<ISpecialistResponseDocument>()
      .exec();

    const result: SpecialistRequestWithResponse = { ...request } as SpecialistRequestWithResponse;
    if (response) {
      result.response = response;
    }

    return result;
  }
}
