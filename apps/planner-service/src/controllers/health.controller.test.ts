import * as mongoose from 'mongoose';
import { HealthController } from './health.controller';
import { createMockLogger } from '../test-utils/mock-logger';

jest.mock('mongoose', () => ({
  connection: { readyState: 1 },
}));

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('HealthController.getHealth', () => {
  let controller: HealthController;

  beforeEach(() => {
    controller = new HealthController(createMockLogger());
  });

  it('returns 200 and status=healthy when mongo readyState=1', async () => {
    (mongoose.connection as any).readyState = 1;
    const res = makeRes();
    await controller.getHealth({} as any, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'healthy', serviceName: 'planner-service' }),
    );
  });

  it('returns 200 and status=degraded when mongo readyState=2', async () => {
    (mongoose.connection as any).readyState = 2;
    const res = makeRes();
    await controller.getHealth({} as any, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'degraded' }));
  });

  it('returns 503 and status=unhealthy when mongo readyState=0', async () => {
    (mongoose.connection as any).readyState = 0;
    const res = makeRes();
    await controller.getHealth({} as any, res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'unhealthy' }));
  });

  it('returns 503 and status=unhealthy when mongo readyState=3', async () => {
    (mongoose.connection as any).readyState = 3;
    const res = makeRes();
    await controller.getHealth({} as any, res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'unhealthy' }));
  });

  it('includes checks.mongo=up when connected', async () => {
    (mongoose.connection as any).readyState = 1;
    const res = makeRes();
    await controller.getHealth({} as any, res);
    const body = res.json.mock.calls[0][0];
    expect(body.checks.mongo).toBe('up');
    expect(typeof body.checks.uptime).toBe('number');
  });

  it('includes checks.mongo=down when disconnected', async () => {
    (mongoose.connection as any).readyState = 0;
    const res = makeRes();
    await controller.getHealth({} as any, res);
    const body = res.json.mock.calls[0][0];
    expect(body.checks.mongo).toBe('down');
  });
});
