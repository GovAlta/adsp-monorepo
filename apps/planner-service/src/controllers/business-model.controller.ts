import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { BusinessModelService, UpdateConceptInput } from '../services/business-model.service';
import { ConceptType } from '../mongo/schemas/business-model.schema';
import { NotFoundError, AppError, ConflictError } from '../types';

// ✓ ASVS:V1.1.1 — business model is Protected B content; tenantId isolation enforced
// ✓ CAS:RULE-015 — concept corrections validated against enum BR-006
// ✓ ASVS:V4.1.1 — tenantId extracted from JWT; never accepted from client input
// FAC-S4-026: no business model content (concept names, descriptions, sourceText) in logs

/**
 * BusinessModelController — exposes two operations on the BusinessModel
 * for a planning session:
 *   GET  /api/v1/sessions/:sessionId/model  — retrieve current model
 *   PATCH /api/v1/sessions/:sessionId/model  — update concept or model fields
 *
 * UC-003: Review and Correct Extracted Business Model
 * BR-006: conceptType must be one of 15 ConceptType values
 */
export class BusinessModelController {
  constructor(
    private readonly businessModelService: BusinessModelService,
    private readonly logger: Logger,
  ) {}

  /**
   * GET /api/v1/sessions/:sessionId/model
   * operationId: getBusinessModel — UC-003
   *
   * Returns the BusinessModel with embedded concepts[], conceptRelationships[],
   * and current confidenceScore for the requesting tenant's session.
   *
   * ✓ ASVS:V4.1.1 — tenantId from req.user; session must belong to this tenant
   * ✓ CAS:RULE-015 — model content only returned for authenticated tenant
   */
  getBusinessModel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // ✓ ASVS:V4.1.1 — identity sourced from validated JWT context, not client input
      const { tenantId } = req.user!;
      const { sessionId } = req.params;

      const model = await this.businessModelService.getBusinessModelBySession(tenantId, sessionId);

      if (!model) {
        return next(new NotFoundError('BusinessModel', sessionId));
      }

      // ✓ ASVS:V7.2.1 — access logged with IDs only; no concept content in log
      this.logger.info('Business model retrieved', {
        sessionId,
        tenantId,
        modelId: model.modelId,
        conceptCount: model.concepts.length,
      });

      res.json(model);
    } catch (err) {
      next(err);
    }
  };

  /**
   * PATCH /api/v1/sessions/:sessionId/model
   * operationId: updateBusinessModel — UC-003
   *
   * Applies corrections to a BusinessConcept (conceptType, name, description)
   * or updates model-level fields (confidenceScore).
   *
   * Optimistic lock: request body MUST include { version } matching the current
   * model version. Mismatch returns HTTP 409 Conflict.
   *
   * Validates conceptType against the 15-value enum per BR-006; invalid value
   * returns HTTP 400 Bad Request.
   *
   * ✓ ASVS:V4.1.1 — tenantId enforced; concept update scoped to tenant's session
   * ✓ CAS:RULE-015 — conceptType enum enforced; no arbitrary type injection
   * ✓ ASVS:V5.1.4 — version-based optimistic locking prevents concurrent overwrites
   */
  updateBusinessModel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // ✓ ASVS:V4.1.1 — tenantId from validated JWT; not from request body
      const { tenantId } = req.user!;
      const { sessionId } = req.params;
      const { version, conceptId, conceptType, name, description, confidenceScore } =
        req.body as {
          version: number;
          conceptId?: string;
          conceptType?: string;
          name?: string;
          description?: string;
          confidenceScore?: number;
        };

      // ✓ ASVS:V5.1.4 — optimistic lock check: read current version first
      const currentVersion = await this.businessModelService.getBusinessModelVersion(
        tenantId,
        sessionId,
      );

      if (currentVersion === null) {
        return next(new NotFoundError('BusinessModel', sessionId));
      }

      // UC-003 exception: version mismatch → 409 Conflict
      if (version !== currentVersion) {
        const conflict = new ConflictError(
          `Business model version conflict: expected version ${currentVersion}, received ${version}. ` +
            `Fetch the latest model and retry.`,
        );
        return next(conflict);
      }

      let updatedModel;

      if (conceptId !== undefined) {
        // Concept-level update (type or name/description correction)
        const updates: UpdateConceptInput = {};
        if (conceptType !== undefined) {
          // ✓ CAS:RULE-015 — conceptType validated against BR-006 enum; invalid values rejected
          // Cast occurs here; service layer re-validates and throws 400 on invalid value
          updates.conceptType = conceptType as ConceptType;
        }
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;

        updatedModel = await this.businessModelService.updateBusinessModelConcept(
          tenantId,
          sessionId,
          conceptId,
          updates,
        );
      } else if (confidenceScore !== undefined) {
        // Model-level confidence score update (BR-004: 0–100)
        updatedModel = await this.businessModelService.updateBusinessModelConfidence(
          tenantId,
          sessionId,
          confidenceScore,
        );
      } else {
        // No actionable fields provided
        return next(new AppError(400, 'Provide conceptId or confidenceScore to update', 'VALIDATION_ERROR'));
      }

      if (!updatedModel) {
        return next(new NotFoundError('BusinessModel', sessionId));
      }

      // ✓ ASVS:V7.2.1 — update logged with IDs and version; no concept content in log
      this.logger.info('Business model updated', {
        sessionId,
        tenantId,
        modelId: updatedModel.modelId,
        newVersion: updatedModel.version,
        // conceptId logged (identifier only, no Protected B content)
        conceptId: conceptId ?? null,
      });

      res.json(updatedModel);
    } catch (err) {
      // BR-006: invalid conceptType → HTTP 400
      if (err instanceof AppError && err.code === 'INVALID_CONCEPT_TYPE') {
        res.status(400).json({
          type: 'https://planner.alberta.ca/errors/invalid-concept-type',
          title: 'Invalid Concept Type',
          status: 400,
          detail: err.message,
          instance: req.path,
        });
        return;
      }
      next(err);
    }
  };
}
