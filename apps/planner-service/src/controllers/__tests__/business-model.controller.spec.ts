/**
 * business-model.controller.spec.ts — Unit tests for BusinessModelController
 *
 * Protected B test data conventions (FAC-S4-027 / CAS:RULE-028):
 *   - concept name / description: '[TEST-DATA]'
 *   - tenantId: 'tenant-abc'
 *   - userId: 'user-xyz'
 *   - No real Protected B content appears in any fixture or assertion.
 *
 * ✓ ASVS:V4.1.1 — tenantId sourced from req.user JWT, never from request body
 * ✓ ASVS:V5.1.4 — optimistic lock (version mismatch → 409) and conceptType enum
 *                  (BR-006 violation → 400) are covered
 * ✓ CAS:RULE-015 — cross-tenant access rejected at service query boundary (404)
 * ✓ CAS:RULE-028 — concept description '[TEST-DATA]' MUST NOT appear in any logger call
 */

import { Request, Response, NextFunction } from 'express';
import { BusinessModelController } from '../business-model.controller';
import { BusinessModelService } from '../../services/business-model.service';
import { NotFoundError, ConflictError, AppError } from '../../types';
import { IBusinessModelDocument } from '../../mongo/schemas/business-model.schema';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('../../services/business-model.service');

const mockBusinessModelService = {
  getBusinessModelBySession: jest.fn(),
  getBusinessModelVersion: jest.fn(),
  updateBusinessModelConcept: jest.fn(),
  updateBusinessModelConfidence: jest.fn(),
  addConcept: jest.fn(),
} as unknown as jest.Mocked<BusinessModelService>;

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeModel = (overrides: Partial<IBusinessModelDocument> = {}): IBusinessModelDocument =>
  ({
    modelId: 'model-001',
    sessionId: 'session-001',
    tenantId: 'tenant-abc',
    concepts: [],
    confidenceScore: 50,
    version: 1,
    ...overrides,
  }) as unknown as IBusinessModelDocument;

const makeReq = (overrides: Partial<Request> = {}): Request =>
  ({
    user: { tenantId: 'tenant-abc', userId: 'user-xyz', roles: ['planner-user'] },
    params: { sessionId: 'session-001' },
    body: {},
    path: '/api/v1/sessions/session-001/model',
    ...overrides,
  }) as unknown as Request;

const makeRes = (): Response => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res as Response;
};

const makeNext = (): NextFunction => jest.fn();

// ---------------------------------------------------------------------------
// Controller under test
// ---------------------------------------------------------------------------

let controller: BusinessModelController;

beforeEach(() => {
  jest.clearAllMocks();
  controller = new BusinessModelController(
    mockBusinessModelService,
    mockLogger as never,
  );
});

// ---------------------------------------------------------------------------
// getBusinessModel
// ---------------------------------------------------------------------------

describe('getBusinessModel', () => {
  // TC-003 — UC-003: model retrieved for authenticated tenant's session
  it('returns HTTP 200 with business model for a valid session', async () => {
    const model = makeModel({ concepts: [] });
    mockBusinessModelService.getBusinessModelBySession.mockResolvedValue(model);

    const req = makeReq();
    const res = makeRes();
    const next = makeNext();

    await controller.getBusinessModel(req, res, next);

    expect(mockBusinessModelService.getBusinessModelBySession).toHaveBeenCalledWith(
      'tenant-abc',
      'session-001',
    );
    expect(res.json).toHaveBeenCalledWith(model);
    expect(next).not.toHaveBeenCalled();
  });

  // TC-005 — UC-003 exception: session has no model → 404
  it('calls next with NotFoundError (404) when no business model exists for the session', async () => {
    mockBusinessModelService.getBusinessModelBySession.mockResolvedValue(null);

    const req = makeReq();
    const res = makeRes();
    const next = makeNext();

    await controller.getBusinessModel(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err.statusCode).toBe(404);
  });

  // TC-003 — model with empty concepts[] is valid and returned as-is
  it('returns HTTP 200 with empty concepts array when model has no concepts', async () => {
    const emptyModel = makeModel({ concepts: [] });
    mockBusinessModelService.getBusinessModelBySession.mockResolvedValue(emptyModel);

    const req = makeReq();
    const res = makeRes();

    await controller.getBusinessModel(req, res, makeNext());

    const responseBody = (res.json as jest.Mock).mock.calls[0][0] as IBusinessModelDocument;
    expect(Array.isArray(responseBody.concepts)).toBe(true);
    expect(responseBody.concepts).toHaveLength(0);
  });

  // TC-003 — FAC-S4-027 / ASVS:V7.2.1: Protected B concept description MUST NOT leak into logs
  it('ASVS:V7.2.1 / FAC-S4-027 — concept description [TEST-DATA] never appears in logger.info call args', async () => {
    const model = makeModel({
      concepts: [
        {
          conceptId: 'c-001',
          conceptType: 'Actor',
          name: '[TEST-DATA]',
          description: '[TEST-DATA]',
          relationships: [],
        },
      ],
    });
    mockBusinessModelService.getBusinessModelBySession.mockResolvedValue(model);

    await controller.getBusinessModel(makeReq(), makeRes(), makeNext());

    // JSON.stringify captures nested object fields — catches any accidental
    // Protected B content in structured log args (FAC-S4-027)
    const allLogArgs = JSON.stringify(mockLogger.info.mock.calls);
    expect(allLogArgs).not.toContain('[TEST-DATA]');
  });
});

// ---------------------------------------------------------------------------
// updateBusinessModel
// ---------------------------------------------------------------------------

describe('updateBusinessModel', () => {
  // TC-102 — ASVS:V5.1.4 optimistic lock: stale version body → 409 Conflict
  it('calls next with ConflictError (409) when client version does not match current model version', async () => {
    mockBusinessModelService.getBusinessModelVersion.mockResolvedValue(3); // server at v3

    const req = makeReq({
      body: { version: 1, conceptId: 'c-001', conceptType: 'Actor' }, // client sends stale v1
    });
    const res = makeRes();
    const next = makeNext();

    await controller.updateBusinessModel(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(ConflictError);
    expect(err.statusCode).toBe(409);
  });

  // TC-036 / TC-089 — CAS:RULE-015 BR-006: invalid conceptType → RFC 7807 400
  it('returns RFC 7807 400 problem detail when service throws INVALID_CONCEPT_TYPE (BR-006)', async () => {
    mockBusinessModelService.getBusinessModelVersion.mockResolvedValue(1);
    mockBusinessModelService.updateBusinessModelConcept.mockRejectedValue(
      new AppError(400, "Invalid conceptType 'Person'.", 'INVALID_CONCEPT_TYPE'),
    );

    const req = makeReq({
      body: { version: 1, conceptId: 'c-001', conceptType: 'Person' },
    });
    const res = makeRes();
    const next = makeNext();

    await controller.updateBusinessModel(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(body.status).toBe(400);
    expect(body.type).toContain('invalid-concept-type');
    // 400 error must not propagate to next() — controller handles it directly
    expect(next).not.toHaveBeenCalled();
  });

  // TC-088 — CAS:RULE-015 valid conceptType update returns 200 with updated model
  it('returns HTTP 200 with updated model on valid concept type correction', async () => {
    const updatedModel = makeModel({ version: 2 });
    mockBusinessModelService.getBusinessModelVersion.mockResolvedValue(1);
    mockBusinessModelService.updateBusinessModelConcept.mockResolvedValue(updatedModel);

    const req = makeReq({
      body: { version: 1, conceptId: 'c-001', conceptType: 'Goal' },
    });
    const res = makeRes();
    const next = makeNext();

    await controller.updateBusinessModel(req, res, next);

    expect(res.json).toHaveBeenCalledWith(updatedModel);
    expect(next).not.toHaveBeenCalled();
  });

  // TC-005 — ASVS:V4.1.1: JWT tenantId ≠ session tenantId → service returns null → 404
  it('ASVS:V4.1.1 — returns 404 when JWT tenantId does not match session tenant (cross-tenant access rejected)', async () => {
    // Service finds no model for the mismatched (tenantId, sessionId) pair
    mockBusinessModelService.getBusinessModelVersion.mockResolvedValue(null);

    const req = makeReq({
      user: { tenantId: 'tenant-OTHER', userId: 'user-xyz', roles: ['planner-user'] },
      body: { version: 1, conceptId: 'c-001', conceptType: 'Actor' },
    });
    const res = makeRes();
    const next = makeNext();

    await controller.updateBusinessModel(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err.statusCode).toBe(404);
  });

  // TC-102 — name and description fields forwarded to service
  it('forwards name and description updates to updateBusinessModelConcept', async () => {
    const updatedModel = makeModel({ version: 2 });
    mockBusinessModelService.getBusinessModelVersion.mockResolvedValue(1);
    mockBusinessModelService.updateBusinessModelConcept.mockResolvedValue(updatedModel);

    const req = makeReq({
      body: {
        version: 1,
        conceptId: 'c-001',
        name: '[TEST-DATA]',
        description: '[TEST-DATA]',
      },
    });

    await controller.updateBusinessModel(req, makeRes(), makeNext());

    expect(mockBusinessModelService.updateBusinessModelConcept).toHaveBeenCalledWith(
      'tenant-abc',
      'session-001',
      'c-001',
      expect.objectContaining({ name: '[TEST-DATA]', description: '[TEST-DATA]' }),
    );
  });

  // TC-102 — confidenceScore path delegates to updateBusinessModelConfidence
  it('delegates confidenceScore update to updateBusinessModelConfidence', async () => {
    const updatedModel = makeModel({ confidenceScore: 80, version: 2 });
    mockBusinessModelService.getBusinessModelVersion.mockResolvedValue(1);
    mockBusinessModelService.updateBusinessModelConfidence.mockResolvedValue(updatedModel);

    const req = makeReq({ body: { version: 1, confidenceScore: 80 } });
    const res = makeRes();

    await controller.updateBusinessModel(req, res, makeNext());

    expect(mockBusinessModelService.updateBusinessModelConfidence).toHaveBeenCalledWith(
      'tenant-abc',
      'session-001',
      80,
    );
    expect(res.json).toHaveBeenCalledWith(updatedModel);
  });

  // TC-102 — ASVS:V7.2.1: update log must not include concept description
  it('ASVS:V7.2.1 / FAC-S4-027 — logger.info on update must not contain concept description content', async () => {
    const updatedModel = makeModel({ version: 2 });
    mockBusinessModelService.getBusinessModelVersion.mockResolvedValue(1);
    mockBusinessModelService.updateBusinessModelConcept.mockResolvedValue(updatedModel);

    const req = makeReq({
      body: { version: 1, conceptId: 'c-001', name: '[TEST-DATA]', description: '[TEST-DATA]' },
    });

    await controller.updateBusinessModel(req, makeRes(), makeNext());

    const allLogArgs = JSON.stringify(mockLogger.info.mock.calls);
    expect(allLogArgs).not.toContain('[TEST-DATA]');
  });
});
