import { AuditController } from './audit.controller';
import { NotFoundError } from '../types';
import { createMockLogger } from '../test-utils/mock-logger';

function makeReq(overrides: any = {}) {
  return {
    user: { tenantId: 'tenant-1', userId: 'user-1', roles: ['planner-admin'] },
    params: {},
    query: {},
    path: '/audit',
    ...overrides,
  } as any;
}

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function makeAuditService(overrides: any = {}) {
  return {
    listAuditEvents: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 }),
    getAuditEvent: jest.fn().mockResolvedValue({ id: 'evt-1', tenantId: 'tenant-1' }),
    verifyAuditChain: jest.fn().mockResolvedValue({ verified: true, checkedCount: 10 }),
    ...overrides,
  };
}

describe('AuditController', () => {
  describe('listAuditEvents', () => {
    it('calls service with default pagination', async () => {
      const svc = makeAuditService();
      const ctrl = new AuditController(svc as any, createMockLogger());
      const req = makeReq({ query: {} });
      const res = makeRes();
      const next = jest.fn();
      await ctrl.listAuditEvents(req, res, next);
      expect(svc.listAuditEvents).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ page: 1, pageSize: 20 }));
      expect(res.json).toHaveBeenCalled();
    });

    it('clamps pageSize to 100 when given 999', async () => {
      const svc = makeAuditService();
      const ctrl = new AuditController(svc as any, createMockLogger());
      const req = makeReq({ query: { pageSize: '999' } });
      await ctrl.listAuditEvents(req, makeRes(), jest.fn());
      expect(svc.listAuditEvents).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ pageSize: 100 }));
    });

    it('passes actorId and action filters when present', async () => {
      const svc = makeAuditService();
      const ctrl = new AuditController(svc as any, createMockLogger());
      const req = makeReq({ query: { actorId: 'actor-99', action: 'DELETE' } });
      await ctrl.listAuditEvents(req, makeRes(), jest.fn());
      expect(svc.listAuditEvents).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ actorId: 'actor-99', action: 'DELETE' }));
    });

    it('calls next on service error', async () => {
      const svc = makeAuditService({ listAuditEvents: jest.fn().mockRejectedValue(new Error('db error')) });
      const ctrl = new AuditController(svc as any, createMockLogger());
      const next = jest.fn();
      await ctrl.listAuditEvents(makeReq(), makeRes(), next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getAuditEvent', () => {
    it('returns the event when found', async () => {
      const svc = makeAuditService({ getAuditEvent: jest.fn().mockResolvedValue({ id: 'evt-1' }) });
      const ctrl = new AuditController(svc as any, createMockLogger());
      const res = makeRes();
      await ctrl.getAuditEvent(makeReq({ params: { eventId: 'evt-1' } }), res, jest.fn());
      expect(res.json).toHaveBeenCalledWith({ id: 'evt-1' });
    });

    it('calls next with NotFoundError when event is null', async () => {
      const svc = makeAuditService({ getAuditEvent: jest.fn().mockResolvedValue(null) });
      const ctrl = new AuditController(svc as any, createMockLogger());
      const next = jest.fn();
      await ctrl.getAuditEvent(makeReq({ params: { eventId: 'missing' } }), makeRes(), next);
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('verifyAuditChain', () => {
    it('caps endIndex at startIndex+499', async () => {
      const svc = makeAuditService({ verifyAuditChain: jest.fn().mockResolvedValue({ verified: true, checkedCount: 500 }) });
      const ctrl = new AuditController(svc as any, createMockLogger());
      const req = makeReq({ query: { startIndex: '0', endIndex: '9999' } });
      await ctrl.verifyAuditChain(req, makeRes(), jest.fn());
      expect(svc.verifyAuditChain).toHaveBeenCalledWith('tenant-1', 0, 499);
    });

    it('uses defaults when params are absent', async () => {
      const svc = makeAuditService();
      const ctrl = new AuditController(svc as any, createMockLogger());
      const req = makeReq({ query: {} });
      await ctrl.verifyAuditChain(req, makeRes(), jest.fn());
      expect(svc.verifyAuditChain).toHaveBeenCalledWith('tenant-1', 0, 99);
    });

    it('returns the verification result', async () => {
      const svc = makeAuditService();
      const ctrl = new AuditController(svc as any, createMockLogger());
      const res = makeRes();
      await ctrl.verifyAuditChain(makeReq({ query: {} }), res, jest.fn());
      expect(res.json).toHaveBeenCalledWith({ verified: true, checkedCount: 10 });
    });
  });
});
