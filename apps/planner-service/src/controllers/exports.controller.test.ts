import { ExportsController } from './exports.controller';
import { NotFoundError, ForbiddenError } from '../types';
import { createMockLogger } from '../test-utils/mock-logger';

function makeReq(overrides: any = {}) {
  return {
    user: { tenantId: 'tenant-1', userId: 'user-1', roles: ['planner-user'] },
    params: { sessionId: 'sess-1', exportId: 'exp-1' },
    query: {},
    body: {},
    path: '/exports',
    ...overrides,
  } as any;
}

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const MOCK_EXPORT = { exportId: 'exp-1', sessionId: 'sess-1', tenantId: 'tenant-1', status: 'complete' };

function makeExportService(overrides: any = {}) {
  return {
    initiateExport: jest.fn().mockResolvedValue(MOCK_EXPORT),
    listExportsForSession: jest.fn().mockResolvedValue({ items: [MOCK_EXPORT], total: 1, page: 1, pageSize: 20 }),
    getExport: jest.fn().mockResolvedValue(MOCK_EXPORT),
    ...overrides,
  };
}

describe('ExportsController', () => {
  describe('initiateExport', () => {
    it('returns 201 with export DTO', async () => {
      const ctrl = new ExportsController(makeExportService() as any, createMockLogger());
      const res = makeRes();
      await ctrl.initiateExport(makeReq(), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(MOCK_EXPORT);
    });

    it('calls next on generic error', async () => {
      const svc = makeExportService({ initiateExport: jest.fn().mockRejectedValue(new Error('db')) });
      const ctrl = new ExportsController(svc as any, createMockLogger());
      const next = jest.fn();
      await ctrl.initiateExport(makeReq(), makeRes(), next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('listExports', () => {
    it('returns paginated list', async () => {
      const ctrl = new ExportsController(makeExportService() as any, createMockLogger());
      const res = makeRes();
      await ctrl.listExports(makeReq(), res, jest.fn());
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ items: [MOCK_EXPORT] }));
    });
  });

  describe('getExport', () => {
    it('returns the export', async () => {
      const ctrl = new ExportsController(makeExportService() as any, createMockLogger());
      const res = makeRes();
      await ctrl.getExport(makeReq(), res, jest.fn());
      expect(res.json).toHaveBeenCalledWith(MOCK_EXPORT);
    });

    it('returns 404 RFC 7807 when not found', async () => {
      const svc = makeExportService({ getExport: jest.fn().mockRejectedValue(new NotFoundError('Export', 'exp-1')) });
      const ctrl = new ExportsController(svc as any, createMockLogger());
      const res = makeRes();
      await ctrl.getExport(makeReq(), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 404 }));
    });

    it('returns 403 RFC 7807 when forbidden', async () => {
      const svc = makeExportService({ getExport: jest.fn().mockRejectedValue(new ForbiddenError('Not your export')) });
      const ctrl = new ExportsController(svc as any, createMockLogger());
      const res = makeRes();
      await ctrl.getExport(makeReq(), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
    });
  });
});
