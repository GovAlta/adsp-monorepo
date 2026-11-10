import * as perfHooks from 'perf_hooks';
import { createMetricsTestKit, histogramCount, MetricsTestKit } from './fixtures/metricsTestKit';
import { bucketMcpMethod, getMetrics, installMetrics } from './metrics';

function blockEventLoop(ms: number): void {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    // Busy-wait on purpose: the test needs a blocked event loop.
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('metrics before install', () => {
  it('records nothing and throws nothing before metrics are installed', () => {
    const metrics = getMetrics();
    expect(() => {
      metrics.addInFlight(1);
      metrics.addInFlight(-1);
      metrics.recordRejection('origin');
      metrics.recordRequest('tools/list', 200, 0.01);
      metrics.recordToolCall('search_adsp_docs', 0.01);
      metrics.recordUpstreamError('list_service_roles', 'network');
      metrics.recordDocsIndexBuild(0.2);
    }).not.toThrow();
  });
});

describe('installed metrics', () => {
  let kit: MetricsTestKit;
  let uninstall: () => void;

  beforeEach(() => {
    kit = createMetricsTestKit();
    ({ uninstall } = installMetrics(kit.provider));
  });

  afterEach(async () => {
    uninstall();
    await kit.shutdown();
  });

  it('exports mcp.tool.duration with the tool name and error type', async () => {
    getMetrics().recordToolCall('search_adsp_docs', 0.012);
    getMetrics().recordToolCall('read_adsp_doc', 0.02, 'tool_error');
    await kit.collect();

    const attributes = kit.points('mcp.tool.duration').map((point) => point.attributes);
    expect(attributes).toHaveLength(2);
    expect(attributes).toEqual(
      expect.arrayContaining([
        { 'mcp.tool.name': 'search_adsp_docs' },
        { 'mcp.tool.name': 'read_adsp_doc', 'error.type': 'tool_error' },
      ])
    );
  });

  it('counts rejections by reason', async () => {
    getMetrics().recordRejection('in_flight_cap');
    getMetrics().recordRejection('in_flight_cap');
    getMetrics().recordRejection('origin');
    await kit.collect();

    const byReason = Object.fromEntries(
      kit.points('mcp.requests.rejected').map((point) => [point.attributes['reason'], point.value])
    );
    expect(byReason).toEqual({ in_flight_cap: 2, origin: 1 });
  });

  it('tracks in-flight requests', async () => {
    getMetrics().addInFlight(1);
    getMetrics().addInFlight(1);
    getMetrics().addInFlight(-1);
    await kit.collect();

    expect(kit.points('mcp.requests.in_flight').map((point) => point.value)).toEqual([1]);
  });

  it('records request duration by method and status', async () => {
    getMetrics().recordRequest('tools/call', 200, 0.03);
    getMetrics().recordRequest('unparsed', 400, 0.001);
    await kit.collect();

    const attributes = kit.points('mcp.request.duration').map((point) => point.attributes);
    expect(attributes).toEqual(
      expect.arrayContaining([
        { 'mcp.method.name': 'tools/call', 'http.response.status_code': 200 },
        { 'mcp.method.name': 'unparsed', 'http.response.status_code': 400 },
      ])
    );
  });

  it('records an aborted request without a status code', async () => {
    getMetrics().recordRequest('tools/call', 'aborted', 2.5);
    await kit.collect();

    expect(kit.points('mcp.request.duration').map((point) => point.attributes)).toEqual([
      { 'mcp.method.name': 'tools/call', 'error.type': 'aborted' },
    ]);
  });

  it('counts live-tool upstream errors by tool and type', async () => {
    getMetrics().recordUpstreamError('list_service_roles', 'http_5xx');
    await kit.collect();

    const [point] = kit.points('mcp.live_tool.upstream.errors');
    expect(point.attributes).toEqual({ 'mcp.tool.name': 'list_service_roles', 'error.type': 'http_5xx' });
    expect(point.value).toBe(1);
  });

  it('records the docs index build duration', async () => {
    getMetrics().recordDocsIndexBuild(0.25);
    await kit.collect();

    const points = kit.points('mcp.docs_index.build.duration');
    expect(points).toHaveLength(1);
    expect(histogramCount(points[0])).toBe(1);
    expect(points[0].attributes).toEqual({});
  });

  it('reports heap and RSS gauges', async () => {
    await kit.collect();

    expect(kit.points('v8js.memory.heap.used')[0].value).toBeGreaterThan(0);
    expect(kit.points('process.memory.usage')[0].value).toBeGreaterThan(0);
  });

  it('nodejs.eventloop.delay.p99 rises when the event loop is blocked', async () => {
    await sleep(100);
    await kit.collect();
    const idleP99 = kit.points('nodejs.eventloop.delay.p99')[0].value as number;
    expect(idleP99).toBeLessThan(0.1);

    // Node drops a delay that starts in the same tick as reset(), which the collect above just called.
    await sleep(50);
    blockEventLoop(200);
    await sleep(30);
    await kit.collect();

    expect(kit.points('nodejs.eventloop.delay.p99')[0].value).toBeGreaterThanOrEqual(0.15);
    expect(kit.points('nodejs.eventloop.delay.max')[0].value).toBeGreaterThanOrEqual(0.15);
    expect(kit.points('nodejs.eventloop.delay.p50')).toHaveLength(1);
  });
});

describe('uninstalling metrics', () => {
  it('restores the no-op recorder and stops the event-loop monitor', async () => {
    const realMonitor = perfHooks.monitorEventLoopDelay;
    let disable: jest.SpyInstance | undefined;
    const monitorSpy = jest.spyOn(perfHooks, 'monitorEventLoopDelay').mockImplementation((options) => {
      const histogram = realMonitor(options);
      disable = jest.spyOn(histogram, 'disable');
      return histogram;
    });
    const kit = createMetricsTestKit();

    try {
      const { uninstall } = installMetrics(kit.provider);
      uninstall();
      getMetrics().recordToolCall('search_adsp_docs', 0.01);
      await kit.collect();

      expect(disable).toHaveBeenCalled();
      expect(kit.points('mcp.tool.duration')).toEqual([]);
    } finally {
      monitorSpy.mockRestore();
      await kit.shutdown();
    }
  });
});

describe('bucketMcpMethod', () => {
  it.each([
    [{ jsonrpc: '2.0', id: 1, method: 'tools/call' }, 'tools/call'],
    [{ jsonrpc: '2.0', id: 1, method: 'initialize' }, 'initialize'],
    [{ jsonrpc: '2.0', method: 'notifications/initialized' }, 'notifications/initialized'],
    [{ jsonrpc: '2.0', id: 1, method: 'x/y' }, 'other'],
    [[{ jsonrpc: '2.0', id: 1, method: 'tools/list' }], 'batch'],
    [undefined, 'unparsed'],
    ['tools/call', 'unparsed'],
    [{}, 'unparsed'],
    [{ method: 42 }, 'unparsed'],
  ])('buckets %j as %s', (message, expected) => {
    expect(bucketMcpMethod(message)).toBe(expected);
  });
});
