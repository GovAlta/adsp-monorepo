jest.mock('@abgov/adsp-cli', () => ({
  getAccessToken: jest.fn(),
  getDirectoryServiceUrl: jest.fn(),
  getServiceRoles: jest.fn(),
  getServiceConfigurationSchemas: jest.fn(),
  HttpRequestError: class extends Error {},
  ServiceNotInDirectoryError: class extends Error {},
}));

import {
  getAccessToken,
  getDirectoryServiceUrl,
  getServiceConfigurationSchemas,
  getServiceRoles,
} from '@abgov/adsp-cli';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { createMetricsTestKit, histogramCount, MetricsTestKit } from '../fixtures/metricsTestKit';
import { connectInMemoryClient, FIXTURE_DOCS_ROOT } from '../fixtures/toolContract';
import { installMetrics } from '../metrics';
import { createAdspMcpServer } from '../server';
import { configureLiveToolLimit, isBusyResult } from './liveToolLimit';
import { createConfigurationSchemaTools } from './registerConfigurationSchemaTool';
import { createServiceRolesTools } from './registerServiceRolesTool';

const mockGetAccessToken = getAccessToken as jest.Mock;
const mockGetDirectoryServiceUrl = getDirectoryServiceUrl as jest.Mock;
const mockGetServiceRoles = getServiceRoles as jest.Mock;
const mockGetSchemas = getServiceConfigurationSchemas as jest.Mock;

const [listServiceRoles] = createServiceRolesTools();
const [getConfigurationSchema] = createConfigurationSchemaTools();

const BUSY_TEXT = 'ADSP upstream is busy. Retry shortly.';

function textOf(result: CallToolResult): string {
  return (result.content[0] as { type: 'text'; text: string }).text;
}

describe('live-tool upstream cap', () => {
  let current: number;
  let peak: number;
  let releaseUpstream: () => void;
  let upstreamHeld: Promise<void>;

  function blockingUpstream<T>(value: T) {
    return async () => {
      current += 1;
      peak = Math.max(peak, current);
      try {
        await upstreamHeld;
        return value;
      } finally {
        current -= 1;
      }
    };
  }

  beforeEach(() => {
    current = 0;
    peak = 0;
    upstreamHeld = new Promise((resolve) => (releaseUpstream = resolve));
    mockGetAccessToken.mockResolvedValue({ status: 'ok', token: 'token-abc' });
    mockGetDirectoryServiceUrl.mockReturnValue('https://directory.example.test');
    mockGetServiceRoles.mockImplementation(blockingUpstream([]));
    mockGetSchemas.mockImplementation(blockingUpstream([]));
  });

  afterEach(() => {
    releaseUpstream();
    configureLiveToolLimit({ maxConcurrent: 8, waitMs: 1000 });
    jest.resetAllMocks();
  });

  async function waitForUpstream(count: number) {
    for (let i = 0; i < 100 && current < count; i++) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  }

  it('never runs more than maxConcurrent upstream sections at once', async () => {
    configureLiveToolLimit({ maxConcurrent: 3, waitMs: 5000 });

    const calls = Array.from({ length: 10 }, (_v, i) =>
      i % 2 === 0 ? listServiceRoles.handler({}) : getConfigurationSchema.handler({})
    );
    await waitForUpstream(3);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(current).toBe(3);
    releaseUpstream();
    const results = await Promise.all(calls);

    expect(peak).toBe(3);
    expect(results).toHaveLength(10);
    expect(results.every((result) => !result.isError)).toBe(true);
  });

  it('returns a busy tool error when no permit frees in time', async () => {
    configureLiveToolLimit({ maxConcurrent: 1, waitMs: 50 });
    const held = listServiceRoles.handler({});
    await waitForUpstream(1);

    const busy = await getConfigurationSchema.handler({});

    expect(busy.isError).toBe(true);
    expect(textOf(busy)).toBe(BUSY_TEXT);
    expect(isBusyResult(busy)).toBe(true);
    releaseUpstream();
    expect(isBusyResult(await held)).toBe(false);
  });

  it('releases the permit when the upstream throws', async () => {
    configureLiveToolLimit({ maxConcurrent: 1, waitMs: 0 });
    mockGetServiceRoles.mockRejectedValueOnce(new Error('upstream failed'));

    const failed = await listServiceRoles.handler({});
    releaseUpstream();
    const next = await getConfigurationSchema.handler({});

    expect(failed.isError).toBe(true);
    expect(isBusyResult(next)).toBe(false);
    expect(next.isError).toBeUndefined();
  });

  it('does not leak a permit after a waiter times out', async () => {
    configureLiveToolLimit({ maxConcurrent: 1, waitMs: 30 });
    const held = listServiceRoles.handler({});
    await waitForUpstream(1);
    const busy = await listServiceRoles.handler({});
    releaseUpstream();
    await held;

    configureLiveToolLimit({ maxConcurrent: 1, waitMs: 0 });
    const next = await listServiceRoles.handler({});

    expect(isBusyResult(busy)).toBe(true);
    expect(isBusyResult(next)).toBe(false);
  });

  it('does not mark ordinary tool errors as busy', async () => {
    mockGetAccessToken.mockResolvedValue({ status: 'not-authenticated' });

    const result = await listServiceRoles.handler({});

    expect(result.isError).toBe(true);
    expect(isBusyResult(result)).toBe(false);
  });

  describe('through the MCP server', () => {
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

    it('counts a live_tool_cap rejection and records error.type=busy on mcp.tool.duration', async () => {
      configureLiveToolLimit({ maxConcurrent: 1, waitMs: 50 });
      const client = await connectInMemoryClient(createAdspMcpServer({ docsRoot: FIXTURE_DOCS_ROOT }));
      const held = client.callTool({ name: 'list_service_roles', arguments: {} });
      await waitForUpstream(1);

      const busy = await client.callTool({ name: 'get_service_configuration_schema', arguments: {} });
      releaseUpstream();
      await held;
      await client.close();
      await kit.collect();

      expect(textOf(busy as CallToolResult)).toBe(BUSY_TEXT);
      expect(kit.points('mcp.requests.rejected').map((point) => [point.attributes['reason'], point.value])).toEqual([
        ['live_tool_cap', 1],
      ]);
      const toolPoints = kit
        .points('mcp.tool.duration')
        .map((point) => ({ attributes: point.attributes, count: histogramCount(point) }));
      expect(toolPoints).toEqual(
        expect.arrayContaining([
          { attributes: { 'mcp.tool.name': 'get_service_configuration_schema', 'error.type': 'busy' }, count: 1 },
          { attributes: { 'mcp.tool.name': 'list_service_roles' }, count: 1 },
        ])
      );
    });
  });
});

describe('live-tool calls from a client that went away', () => {
  let releaseUpstream: () => void;

  function upstreamCalls(): number {
    return mockGetServiceRoles.mock.calls.length + mockGetSchemas.mock.calls.length;
  }

  beforeEach(() => {
    const upstreamHeld = new Promise<void>((resolve) => (releaseUpstream = resolve));
    mockGetAccessToken.mockResolvedValue({ status: 'ok', token: 'token-abc' });
    mockGetDirectoryServiceUrl.mockReturnValue('https://directory.example.test');
    mockGetServiceRoles.mockImplementation(async () => {
      await upstreamHeld;
      return [];
    });
    mockGetSchemas.mockImplementation(async () => {
      await upstreamHeld;
      return [];
    });
  });

  afterEach(() => {
    releaseUpstream();
    configureLiveToolLimit({ maxConcurrent: 8, waitMs: 1000 });
    jest.resetAllMocks();
  });

  it('drops a queued call whose client disconnected, without calling ADSP or counting it as busy', async () => {
    configureLiveToolLimit({ maxConcurrent: 1, waitMs: 5000 });
    const kit = createMetricsTestKit();
    const { uninstall } = installMetrics(kit.provider);
    try {
      const held = listServiceRoles.handler({});
      await new Promise((resolve) => setTimeout(resolve, 20));
      const abort = new AbortController();
      const abandoned = getConfigurationSchema.handler({}, { signal: abort.signal });
      const next = listServiceRoles.handler({});

      abort.abort();
      const dropped = await abandoned;
      releaseUpstream();
      await Promise.all([held, next]);
      await kit.collect();

      expect(dropped.isError).toBe(true);
      expect(isBusyResult(dropped)).toBe(false);
      expect(upstreamCalls()).toBe(2);
      expect(mockGetSchemas).not.toHaveBeenCalled();
      expect(kit.points('mcp.requests.rejected')).toEqual([]);
    } finally {
      uninstall();
      await kit.shutdown();
    }
  });

  it('skips the upstream calls when the client has already gone', async () => {
    const abort = new AbortController();
    abort.abort();

    const result = await listServiceRoles.handler({}, { signal: abort.signal });

    expect(result.isError).toBe(true);
    expect(mockGetAccessToken).not.toHaveBeenCalled();
    expect(upstreamCalls()).toBe(0);
  });

  it('cancels a queued call when the MCP client cancels the request', async () => {
    configureLiveToolLimit({ maxConcurrent: 1, waitMs: 5000 });
    const client = await connectInMemoryClient(createAdspMcpServer({ docsRoot: FIXTURE_DOCS_ROOT }));
    const held = client.callTool({ name: 'list_service_roles', arguments: {} });
    await new Promise((resolve) => setTimeout(resolve, 20));
    const abort = new AbortController();
    const cancelled = client
      .callTool({ name: 'get_service_configuration_schema', arguments: {} }, undefined, { signal: abort.signal })
      .catch(() => 'cancelled');

    abort.abort();
    expect(await cancelled).toBe('cancelled');
    await new Promise((resolve) => setTimeout(resolve, 20));
    releaseUpstream();
    await held;
    await new Promise((resolve) => setTimeout(resolve, 20));
    await client.close();

    expect(mockGetServiceRoles).toHaveBeenCalledTimes(1);
    expect(mockGetSchemas).not.toHaveBeenCalled();
  });
});
