import { BusinessModelController } from './business-model.controller';
import { NotFoundError, AppError, ConflictError } from '../types';
import { createMockLogger } from '../test-utils/mock-logger';

function makeReq(overrides: any = {}) {
  return {
    user: { tenantId: 'tenant-1', userId: 'user-1', roles: ['planner-user'] },
    params: { sessionId: 'sess-1' },
    body: {},
    path: '/model',
    ...overrides,
  } as any;
}

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const MOCK_MODEL = {
  modelId: 'bm-1',
  sessionId: 'sess-1',
  tenantId: 'tenant-1',
  version: 3,
  confidenceScore: 72,
  concepts: [{ conceptId: 'bc-1', conceptType: 'actor', name: 'Applicant' }],
};

function makeService(overrides: any = {}) {
  return {
    getBusinessModelBySession: jest.fn().mockResolvedValue(MOCK_MODEL),
    getBusinessModelVersion: jest.fn().mockResolvedValue(3),
    updateBusinessModelConcept: jest.fn().mockResolvedValue({ ...MOCK_MODEL, version: 4 }),
    updateBusinessModelConfidence: jest.fn().mockResolvedValue({ ...MOCK_MODEL, confidenceScore: 80, version: 4 }),
    ...overrides,
  };
}

describe('BusinessModelController', () => {
  describe('getBusinessModel', () => {
    it('returns the business model', async () => {
      const ctrl = new BusinessModelController(makeService() as any, createMockLogger());
      const res = makeRes();
      await ctrl.getBusinessModel(makeReq(), res, jest.fn());
      expect(res.json).toHaveBeenCalledWith(MOCK_MODEL);
    });

    it('calls next with NotFoundError when model is null', async () => {
      const ctrl = new BusinessModelController(makeService({ getBusinessModelBySession: jest.fn().mockResolvedValue(null) }) as any, createMockLogger());
      const next = jest.fn();
      await ctrl.getBusinessModel(makeReq(), makeRes(), next);
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('updateBusinessModel', () => {
    it('updates a concept when conceptId provided and version matches', async () => {
      const svc = makeService();
      const ctrl = new BusinessModelController(svc as any, createMockLogger());
      const req = makeReq({ body: { version: 3, conceptId: 'bc-1', conceptType: 'goal' } });
      const res = makeRes();
      await ctrl.updateBusinessModel(req, res, jest.fn());
      expect(svc.updateBusinessModelConcept).toHaveBeenCalledWith('tenant-1', 'sess-1', 'bc-1', { conceptType: 'goal' });
      expect(res.json).toHaveBeenCalled();
    });

    it('returns 409 when version mismatches', async () => {
      const ctrl = new BusinessModelController(makeService() as any, createMockLogger());
      const req = makeReq({ body: { version: 1, conceptId: 'bc-1', conceptType: 'goal' } });
      const next = jest.fn();
      await ctrl.updateBusinessModel(req, makeRes(), next);
      expect(next).toHaveBeenCalledWith(expect.any(ConflictError));
    });

    it('returns 400 RFC 7807 for invalid conceptType', async () => {
      const svc = makeService({
        updateBusinessModelConcept: jest.fn().mockRejectedValue(
          new AppError(400, "Invalid conceptType 'bogus'", 'INVALID_CONCEPT_TYPE'),
        ),
      });
      const ctrl = new BusinessModelController(svc as any, createMockLogger());
      const req = makeReq({ body: { version: 3, conceptId: 'bc-1', conceptType: 'bogus' } });
      const res = makeRes();
      await ctrl.updateBusinessModel(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
    });

    it('updates confidenceScore when conceptId absent', async () => {
      const svc = makeService();
      const ctrl = new BusinessModelController(svc as any, createMockLogger());
      const req = makeReq({ body: { version: 3, confidenceScore: 80 } });
      const res = makeRes();
      await ctrl.updateBusinessModel(req, res, jest.fn());
      expect(svc.updateBusinessModelConfidence).toHaveBeenCalledWith('tenant-1', 'sess-1', 80);
      expect(res.json).toHaveBeenCalled();
    });

    it('returns 400 when neither conceptId nor confidenceScore provided', async () => {
      const ctrl = new BusinessModelController(makeService() as any, createMockLogger());
      const req = makeReq({ body: { version: 3 } });
      const next = jest.fn();
      await ctrl.updateBusinessModel(req, makeRes(), next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('calls next with NotFoundError when model does not exist', async () => {
      const ctrl = new BusinessModelController(
        makeService({ getBusinessModelVersion: jest.fn().mockResolvedValue(null) }) as any,
        createMockLogger(),
      );
      const req = makeReq({ body: { version: 1, conceptId: 'bc-1' } });
      const next = jest.fn();
      await ctrl.updateBusinessModel(req, makeRes(), next);
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });
});
