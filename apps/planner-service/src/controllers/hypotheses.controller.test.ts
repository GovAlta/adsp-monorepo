import { HypothesesController } from './hypotheses.controller';
import { NotFoundError, AppError } from '../types';
import { createMockLogger } from '../test-utils/mock-logger';

function makeReq(overrides: any = {}) {
  return {
    user: { tenantId: 'tenant-1', userId: 'user-1', roles: ['planner-user'] },
    params: { sessionId: 'sess-1', hypothesisId: 'hyp-1' },
    body: {},
    path: '/hypotheses/hyp-1',
    ...overrides,
  } as any;
}

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const MOCK_HYP = {
  hypothesisId: 'hyp-1',
  sessionId: 'sess-1',
  tenantId: 'tenant-1',
  title: 'Test hypothesis',
  status: 'proposed',
};

function makeHypService(overrides: any = {}) {
  return {
    listHypotheses: jest.fn().mockResolvedValue([MOCK_HYP]),
    getHypothesisById: jest.fn().mockResolvedValue(MOCK_HYP),
    updateHypothesisStatus: jest.fn().mockResolvedValue({ ...MOCK_HYP, status: 'accepted' }),
    ...overrides,
  };
}

function makeEventService() {
  return { publishEvent: jest.fn().mockResolvedValue(undefined) };
}

describe('HypothesesController', () => {
  describe('listHypotheses', () => {
    it('returns items and total', async () => {
      const ctrl = new HypothesesController(makeHypService() as any, makeEventService() as any, createMockLogger());
      const res = makeRes();
      await ctrl.listHypotheses(makeReq(), res, jest.fn());
      expect(res.json).toHaveBeenCalledWith({ items: [MOCK_HYP], total: 1 });
    });

    it('calls next on service error', async () => {
      const svc = makeHypService({ listHypotheses: jest.fn().mockRejectedValue(new Error('db')) });
      const ctrl = new HypothesesController(svc as any, makeEventService() as any, createMockLogger());
      const next = jest.fn();
      await ctrl.listHypotheses(makeReq(), makeRes(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getHypothesis', () => {
    it('returns the hypothesis', async () => {
      const ctrl = new HypothesesController(makeHypService() as any, makeEventService() as any, createMockLogger());
      const res = makeRes();
      await ctrl.getHypothesis(makeReq(), res, jest.fn());
      expect(res.json).toHaveBeenCalledWith(MOCK_HYP);
    });

    it('calls next with NotFoundError when null', async () => {
      const svc = makeHypService({ getHypothesisById: jest.fn().mockResolvedValue(null) });
      const ctrl = new HypothesesController(svc as any, makeEventService() as any, createMockLogger());
      const next = jest.fn();
      await ctrl.getHypothesis(makeReq(), makeRes(), next);
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('updateHypothesisStatus', () => {
    it('updates status and publishes event on accepted', async () => {
      const eventSvc = makeEventService();
      const ctrl = new HypothesesController(makeHypService() as any, eventSvc as any, createMockLogger());
      const req = makeReq({ body: { status: 'accepted' } });
      const res = makeRes();
      await ctrl.updateHypothesisStatus(req, res, jest.fn());
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'accepted' }));
      expect(eventSvc.publishEvent).toHaveBeenCalled();
    });

    it('does not publish event on rejected', async () => {
      const eventSvc = makeEventService();
      const svc = makeHypService({ updateHypothesisStatus: jest.fn().mockResolvedValue({ ...MOCK_HYP, status: 'rejected' }) });
      const ctrl = new HypothesesController(svc as any, eventSvc as any, createMockLogger());
      const req = makeReq({ body: { status: 'rejected' } });
      await ctrl.updateHypothesisStatus(req, makeRes(), jest.fn());
      expect(eventSvc.publishEvent).not.toHaveBeenCalled();
    });

    it('returns 422 RFC 7807 on INVALID_STATE_TRANSITION', async () => {
      const svc = makeHypService({
        updateHypothesisStatus: jest.fn().mockRejectedValue(
          new AppError(422, 'Cannot transition accepted→draft', 'INVALID_STATE_TRANSITION'),
        ),
      });
      const ctrl = new HypothesesController(svc as any, makeEventService() as any, createMockLogger());
      const req = makeReq({ body: { status: 'draft' } });
      const res = makeRes();
      await ctrl.updateHypothesisStatus(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        type: expect.stringContaining('invalid-state-transition'),
        status: 422,
      }));
    });
  });
});
