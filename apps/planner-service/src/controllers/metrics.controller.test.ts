import { MetricsController } from './metrics.controller';
import { createMockLogger } from '../test-utils/mock-logger';

jest.mock('../services/metrics.service', () => ({
  MetricsService: jest.fn().mockImplementation(() => ({
    getMetrics: jest.fn().mockReturnValue({
      prometheusText: '# HELP planner_up\nplanner_up 1\n',
      uptimeSeconds: 42,
    }),
  })),
}));

function makeRes() {
  const res: any = {};
  res.set = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

describe('MetricsController.getMetrics', () => {
  let controller: MetricsController;

  beforeEach(() => {
    controller = new MetricsController(createMockLogger());
  });

  it('sets Content-Type to Prometheus text format', () => {
    const res = makeRes();
    controller.getMetrics({} as any, res);
    expect(res.set).toHaveBeenCalledWith(
      'Content-Type',
      'text/plain; version=0.0.4; charset=utf-8',
    );
  });

  it('sends the prometheusText from MetricsService', () => {
    const res = makeRes();
    controller.getMetrics({} as any, res);
    expect(res.send).toHaveBeenCalledWith('# HELP planner_up\nplanner_up 1\n');
  });
});
