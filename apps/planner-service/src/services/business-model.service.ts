import { Logger } from 'winston';
import { NotFoundError, AppError } from '../types';
import {
  BusinessModelModel,
  IBusinessModelDocument,
  IBusinessConcept,
  ConceptType,
  CONCEPT_TYPES,
} from '../mongo/schemas/business-model.schema';

// ✓ ASVS:V4.1.1 — tenantId enforced on every query; no cross-tenant access possible
// ✓ CAS:RULE-015 — all Mongoose queries include { tenantId } predicate
// ✓ ASVS:V5.1.4 — conceptType validated against CONCEPT_TYPES enum (BR-006) before write

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface UpdateConceptInput {
  conceptType?: ConceptType;
  name?: string;
  description?: string;
}

export interface AddConceptInput {
  conceptId: string;
  conceptType: ConceptType;
  name: string;
  description?: string;
  sourceText?: string;
}

// ---------------------------------------------------------------------------
// BusinessModelService
// ---------------------------------------------------------------------------

/**
 * BusinessModelService — manages business model retrieval and mutation for
 * planning sessions. All operations are scoped to (tenantId, sessionId).
 *
 * UC-003: Review and Correct Extracted Business Model
 * BR-006: BusinessConcept.conceptType must be one of 15 valid ConceptType values
 * BR-004: confidenceScore bounded 0–100
 */
export class BusinessModelService {
  constructor(private readonly logger: Logger) {}

  /**
   * getBusinessModelBySession — retrieves the BusinessModel document for a given
   * (tenantId, sessionId) pair. Returns null when not found.
   *
   * ✓ ASVS:V4.1.1 — both tenantId and sessionId required in predicate
   * ✓ CAS:RULE-015 — tenantId isolation; no cross-tenant model retrieval
   */
  async getBusinessModelBySession(
    tenantId: string,
    sessionId: string,
  ): Promise<IBusinessModelDocument | null> {
    // ✓ ASVS:V4.1.1 — tenantId always included in query predicate
    return BusinessModelModel.findOne({ tenantId, sessionId }).lean<IBusinessModelDocument>().exec();
  }

  /**
   * getBusinessModelVersion — returns the current version number for optimistic
   * locking. Returns null when no model exists for the session.
   *
   * UC-003: client must supply current version in PATCH body; mismatch → HTTP 409.
   * ✓ ASVS:V4.1.1 — tenantId enforced to prevent cross-tenant version reads
   */
  async getBusinessModelVersion(
    tenantId: string,
    sessionId: string,
  ): Promise<number | null> {
    const doc = await BusinessModelModel
      .findOne({ tenantId, sessionId }, { version: 1 })
      .lean<{ version: number }>()
      .exec();
    return doc ? doc.version : null;
  }

  /**
   * updateBusinessModelConcept — applies conceptType and/or name/description
   * corrections to a single BusinessConcept identified by conceptId.
   *
   * Increments the model version on every successful update (optimistic lock).
   * Throws ValidationError (400) if conceptType is not a valid ConceptType.
   * Throws NotFoundError (404) if concept not found within the model.
   *
   * UC-003: correct concept type
   * BR-006: conceptType must be one of the 15 allowed values
   *
   * ✓ ASVS:V5.1.4 — conceptType validated against CONCEPT_TYPES before write
   * ✓ CAS:RULE-015 — concept update enforced within tenant boundary
   */
  async updateBusinessModelConcept(
    tenantId: string,
    sessionId: string,
    conceptId: string,
    updates: UpdateConceptInput,
  ): Promise<IBusinessModelDocument | null> {
    // ✓ ASVS:V5.1.4 — BR-006 enum validation before Mongoose write
    if (updates.conceptType !== undefined && !CONCEPT_TYPES.includes(updates.conceptType)) {
      const err = new AppError(
        400,
        `Invalid conceptType '${updates.conceptType}'. ` +
          `Valid values: ${CONCEPT_TYPES.join(', ')}`,
        'INVALID_CONCEPT_TYPE',
      );
      throw err;
    }

    // Build positional update for matching concept sub-document
    const setFields: Record<string, unknown> = {};
    if (updates.conceptType !== undefined) setFields['concepts.$.conceptType'] = updates.conceptType;
    if (updates.name !== undefined) setFields['concepts.$.name'] = updates.name;
    if (updates.description !== undefined) setFields['concepts.$.description'] = updates.description;

    // ✓ ASVS:V4.1.1 — tenantId + sessionId + conceptId in predicate
    const updated = await BusinessModelModel.findOneAndUpdate(
      { tenantId, sessionId, 'concepts.conceptId': conceptId },
      {
        $set: setFields,
        $inc: { version: 1 },
      },
      { new: true },
    ).lean<IBusinessModelDocument>().exec();

    if (!updated) {
      // Either the model itself or the specific concept was not found.
      // Check if the model exists to give a more precise error.
      const modelExists = await BusinessModelModel
        .findOne({ tenantId, sessionId }, { modelId: 1 })
        .lean()
        .exec();
      if (!modelExists) {
        throw new NotFoundError('BusinessModel', sessionId);
      }
      throw new NotFoundError('BusinessConcept', conceptId);
    }

    return updated;
  }

  /**
   * updateBusinessModelConfidence — updates the top-level confidenceScore.
   * Increments model version. BR-004: score must be 0–100 (Mongoose enforces this).
   *
   * ✓ ASVS:V5.1.3 — confidenceScore bounds validated by schema (min:0, max:100)
   * ✓ ASVS:V4.1.1 — tenantId enforced on write
   */
  async updateBusinessModelConfidence(
    tenantId: string,
    sessionId: string,
    confidenceScore: number,
  ): Promise<IBusinessModelDocument | null> {
    // ✓ ASVS:V5.1.3 — range guard in addition to Mongoose schema constraint
    if (confidenceScore < 0 || confidenceScore > 100) {
      throw new AppError(400, 'confidenceScore must be between 0 and 100', 'VALIDATION_ERROR');
    }

    return BusinessModelModel.findOneAndUpdate(
      { tenantId, sessionId },
      { $set: { confidenceScore }, $inc: { version: 1 } },
      { new: true },
    ).lean<IBusinessModelDocument>().exec();
  }

  /**
   * addConcept — appends a new BusinessConcept to the concepts[] array.
   * Increments model version. Validates conceptType per BR-006.
   *
   * ✓ ASVS:V5.1.4 — conceptType validated before appending
   * ✓ CAS:RULE-028 — sourceText (Protected B) stored, never logged
   */
  async addConcept(
    tenantId: string,
    sessionId: string,
    concept: AddConceptInput,
  ): Promise<IBusinessModelDocument | null> {
    // ✓ ASVS:V5.1.4 — BR-006 enum check before push
    if (!CONCEPT_TYPES.includes(concept.conceptType)) {
      throw new AppError(
        400,
        `Invalid conceptType '${concept.conceptType}'. Valid values: ${CONCEPT_TYPES.join(', ')}`,
        'INVALID_CONCEPT_TYPE',
      );
    }

    const newConcept: IBusinessConcept = {
      conceptId: concept.conceptId,
      conceptType: concept.conceptType,
      name: concept.name,
      description: concept.description,
      sourceText: concept.sourceText,
      relationships: [],
    };

    return BusinessModelModel.findOneAndUpdate(
      { tenantId, sessionId },
      { $push: { concepts: newConcept }, $inc: { version: 1 } },
      { new: true },
    ).lean<IBusinessModelDocument>().exec();
  }
}
