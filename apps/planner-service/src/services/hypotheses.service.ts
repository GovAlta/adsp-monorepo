import * as crypto from 'crypto';
import { Logger } from 'winston';
import { NotFoundError, AppError } from '../types';
import {
  HypothesisRecordModel,
  IHypothesisRecordDocument,
  HypothesisStatus,
} from '../mongo/schemas/hypothesis-record.schema';

// ✓ ASVS:V4.1.3 — hypothesis status transition enforced; no forbidden status changes
// ✓ CAS:RULE-017 — BR-010 state machine enforced at service layer
// ✓ ASVS:V4.1.1 — tenantId enforced on every Mongoose query predicate
// ✓ CAS:RULE-028 — hypothesis summary/reasoning are Protected B; never logged (only IDs logged)

// ---------------------------------------------------------------------------
// BR-010: Hypothesis status state machine
// Valid transitions (source → allowed targets):
//   draft      → proposed
//   proposed   → accepted, rejected, superseded
//   accepted   → (terminal)
//   rejected   → (terminal)
//   superseded → (terminal)
// ✓ ASVS:V5.1.4 — state machine matches BR-010 transitions table
// ---------------------------------------------------------------------------
export const VALID_HYPOTHESIS_TRANSITIONS: Readonly<Record<HypothesisStatus, HypothesisStatus[]>> = {
  draft: ['proposed'],
  proposed: ['accepted', 'rejected', 'superseded'],
  accepted: [],
  rejected: [],
  superseded: [],
};

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CreateHypothesisInput {
  sessionId: string;
  tenantId: string;
  summary: string;
  reasoning?: string;
  adspServices: string[];
  patternId?: string;
}

// ---------------------------------------------------------------------------
// HypothesesService
// ---------------------------------------------------------------------------

/**
 * HypothesesService — manages solution hypothesis lifecycle for planning sessions.
 * All operations are scoped to (tenantId, sessionId).
 *
 * UC-004: Review and Action Solution Hypotheses
 * BR-010: status state machine (draft→proposed→accepted|rejected|superseded)
 */
export class HypothesesService {
  constructor(private readonly logger: Logger) {}

  /**
   * listHypotheses — returns all hypotheses for a (tenantId, sessionId), newest first.
   *
   * ✓ ASVS:V4.1.1 — tenantId + sessionId in predicate; no cross-tenant records returned
   * ✓ CAS:RULE-028 — records returned to controller; content not logged here
   */
  async listHypotheses(
    tenantId: string,
    sessionId: string,
  ): Promise<IHypothesisRecordDocument[]> {
    // ✓ ASVS:V4.1.1 — both tenantId and sessionId required; descending by createdAt
    return HypothesisRecordModel
      .find({ tenantId, sessionId })
      .sort({ createdAt: -1 })
      .lean<IHypothesisRecordDocument[]>()
      .exec();
  }

  /**
   * getHypothesisById — retrieves a single hypothesis by (tenantId, sessionId, hypothesisId).
   * Returns null when not found within the tenant boundary.
   *
   * ✓ ASVS:V4.1.1 — all three dimensions required; tenant cannot access another tenant's record
   */
  async getHypothesisById(
    tenantId: string,
    sessionId: string,
    hypothesisId: string,
  ): Promise<IHypothesisRecordDocument | null> {
    // ✓ ASVS:V4.1.1 — triple-key lookup prevents cross-tenant access
    return HypothesisRecordModel
      .findOne({ tenantId, sessionId, hypothesisId })
      .lean<IHypothesisRecordDocument>()
      .exec();
  }

  /**
   * updateHypothesisStatus — transitions hypothesis to a new status.
   *
   * Validates the transition against the BR-010 state machine.
   * Throws INVALID_STATE_TRANSITION (422) for disallowed moves.
   * Throws NOT_FOUND (404) when hypothesis does not exist.
   *
   * UC-004: accept, reject, or supersede a hypothesis
   * BR-010: transition rules enforced here
   *
   * ✓ ASVS:V4.1.3 — state machine enforced server-side; client cannot set arbitrary status
   * ✓ CAS:RULE-017 — BR-010 transition table applied; invalid moves rejected
   */
  async updateHypothesisStatus(
    tenantId: string,
    sessionId: string,
    hypothesisId: string,
    newStatus: HypothesisStatus,
  ): Promise<IHypothesisRecordDocument> {
    // ✓ ASVS:V4.1.1 — fetch with tenant scope to enforce isolation
    const existing = await HypothesisRecordModel
      .findOne({ tenantId, sessionId, hypothesisId })
      .exec();

    if (!existing) {
      throw new NotFoundError('Hypothesis', hypothesisId);
    }

    const currentStatus = existing.status;
    const allowed = VALID_HYPOTHESIS_TRANSITIONS[currentStatus];

    // BR-010 / UC-004: special constraint — HTTP 409 when attempting to supersede
    // an already-accepted hypothesis (must be checked BEFORE the general 422 check because
    // accepted→[] would otherwise emit 422 rather than the required 409).
    if (newStatus === 'superseded' && currentStatus === 'accepted') {
      throw new AppError(
        409,
        `Cannot supersede hypothesis '${hypothesisId}': it is already accepted.`,
        'CONFLICT',
      );
    }

    // ✓ ASVS:V5.1.4 — BR-010 transition validation (general state machine; 422 Unprocessable)
    if (!allowed.includes(newStatus)) {
      throw new AppError(
        422,
        `Cannot transition hypothesis from '${currentStatus}' to '${newStatus}'. ` +
          `Valid transitions from '${currentStatus}': [${allowed.join(', ') || 'none'}].`,
        'INVALID_STATE_TRANSITION',
      );
    }

    existing.status = newStatus;
    existing.version = (existing.version || 1) + 1;
    const saved = await existing.save();
    return saved.toObject() as IHypothesisRecordDocument;
  }

  /**
   * createHypothesis — creates a new HypothesisRecord in 'draft' status.
   * Reserved for future use when LLM pipeline (INT-001) is unblocked.
   *
   * ✓ ASVS:V4.1.1 — tenantId enforced; summary/reasoning not logged
   * ✓ CAS:RULE-028 — Protected B content (summary, reasoning) only stored, never logged
   */
  async createHypothesis(
    tenantId: string,
    sessionId: string,
    summary: string,
    reasoning: string | undefined,
    adspServices: string[],
    patternId?: string,
  ): Promise<IHypothesisRecordDocument> {
    const hypothesisId = crypto.randomUUID();

    const doc = new HypothesisRecordModel({
      hypothesisId,
      sessionId,
      tenantId,
      status: 'draft' as HypothesisStatus,
      summary,
      reasoning,
      adspServices,
      patternId,
      version: 1,
    });

    const saved = await doc.save();
    // ✓ CAS:RULE-028 — hypothesis content not logged; only identifiers
    this.logger.info('Hypothesis created', { hypothesisId, sessionId, tenantId });
    return saved.toObject() as IHypothesisRecordDocument;
  }
}
