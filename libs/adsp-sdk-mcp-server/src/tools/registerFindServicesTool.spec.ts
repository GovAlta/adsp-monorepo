import { join } from 'path';
import { CapabilityCatalog, loadCapabilityCatalog } from '../capabilities/catalog';
import { LinkIndex } from './links';
import { createFindServicesTool, FIND_SERVICES_OUTPUT_SCHEMA } from './registerFindServicesTool';

const CATALOG_PATH = join(__dirname, '..', '..', 'assets', 'capabilities.json');

type Result = Record<string, unknown>;

function linkIndex(overrides: Partial<LinkIndex> = {}): LinkIndex {
  return { hasDoc: () => true, hasServiceApi: () => true, ...overrides } as LinkIndex;
}

function nextOf(output: { structuredContent?: Record<string, unknown> }) {
  return output.structuredContent?.next as { suggested_calls: Record<string, unknown>[] } | undefined;
}

function results(output: { structuredContent?: Record<string, unknown> }): Result[] {
  return (output.structuredContent as { results: Result[] }).results;
}

describe('find_adsp_services', () => {
  let loads: number;
  let tool: ReturnType<typeof createFindServicesTool>[number];
  let index: LinkIndex;

  const create = () =>
    createFindServicesTool(
      (): CapabilityCatalog => {
        loads += 1;
        return loadCapabilityCatalog(CATALOG_PATH);
      },
      () => index,
    )[0];

  beforeEach(() => {
    loads = 0;
    index = linkIndex();
    tool = create();
  });

  it('returns service, fit and reason only, by default', async () => {
    const output = await tool.handler({ need: 'upload file' });
    const [result] = results(output);
    const [match] = result.matches as Result[];

    expect(result).toMatchObject({ need: 'upload file', ask: false });
    expect(Object.keys(match)).toEqual(['service', 'fit', 'reason']);
    expect(match.service).toBe('file-service');
  });

  it('adds dependencies, registration, guide, fit questions and risks with response_format detailed', async () => {
    const [result] = results(await tool.handler({ need: 'upload file', response_format: 'detailed' }));

    expect((result.matches as Result[])[0]).toMatchObject({
      service: 'file-service',
      name: 'File service',
      dependsOn: [],
      registration: { fields: ['fileTypes'], serviceConfigurations: 'urn:ads:platform:file-service' },
      doc: 'services/file-service.md',
      specialist: true,
    });
  });

  it('matches each of several needs, in order', async () => {
    const output = await tool.handler({ needs: ['upload file', 'blockchain ledger'] });

    expect(results(output).map(({ need }) => need)).toEqual(['upload file', 'blockchain ledger']);
    expect(results(output)[1]).toMatchObject({
      matches: [],
      noMatch: { need: 'blockchain ledger', reason: 'No ADSP service in the catalog covers this need.' },
    });
  });

  it('returns the same JSON as text, for clients that ignore structured content', async () => {
    const output = await tool.handler({ need: 'upload file' });

    expect(JSON.parse((output.content[0] as { text: string }).text)).toEqual(output.structuredContent);
  });

  it.each([
    { args: {}, input: 'neither need nor needs' },
    { args: { need: 'upload file', needs: ['upload file'] }, input: 'both need and needs' },
    { args: { need: '   ' }, input: 'a blank need' },
    { args: { needs: [] }, input: 'an empty needs list' },
  ])('returns an error for $input', async ({ args }) => {
    const output = await tool.handler(args);

    expect(output.isError).toBe(true);
    expect(output.structuredContent).toBeUndefined();
  });

  it('loads the catalog once, on first use', async () => {
    expect(loads).toBe(0);

    await tool.handler({ need: 'upload file' });
    await tool.handler({ need: 'send an email' });

    expect(loads).toBe(1);
  });

  it("suggests reading the first strong match's doc and searching its endpoints", async () => {
    const output = await tool.handler({ need: 'upload file' });

    expect(nextOf(output)).toEqual({
      suggested_calls: [
        { tool: 'read_adsp_doc', arguments: { path: 'services/file-service.md' }, why: expect.any(String) },
        {
          tool: 'search_service_endpoints',
          arguments: { query: 'upload file', service: 'file-service' },
          why: expect.any(String),
        },
      ],
    });
    expect(
      Object.keys((nextOf(output) as { suggested_calls: Result[] }).suggested_calls[1].arguments as Result),
    ).toEqual(['query', 'service']);
    expect(JSON.parse((output.content[0] as { text: string }).text)).toEqual(output.structuredContent);
  });

  it('uses the first strong match when several needs are passed', async () => {
    const output = await tool.handler({ needs: ['blockchain ledger', 'upload file', 'send an email'] });

    expect(nextOf(output)?.suggested_calls[1].arguments).toEqual({ query: 'upload file', service: 'file-service' });
  });

  it('leaves next out when no match is strong', async () => {
    const output = await tool.handler({ need: 'blockchain ledger' });

    expect(output.structuredContent).not.toHaveProperty('next');
  });

  it('skips a suggestion whose doc is not bundled or whose service has no API', async () => {
    index = linkIndex({ hasDoc: () => false });
    expect(nextOf(await tool.handler({ need: 'upload file' }))?.suggested_calls.map(({ tool }) => tool)).toEqual([
      'search_service_endpoints',
    ]);

    index = linkIndex({ hasServiceApi: () => false });
    expect(nextOf(await tool.handler({ need: 'upload file' }))?.suggested_calls.map(({ tool }) => tool)).toEqual([
      'read_adsp_doc',
    ]);

    index = linkIndex({ hasDoc: () => false, hasServiceApi: () => false });
    expect(await tool.handler({ need: 'upload file' })).not.toHaveProperty('structuredContent.next');
  });

  it('declares next in the output schema and keeps structuredContent valid against it', async () => {
    const next = FIND_SERVICES_OUTPUT_SCHEMA.properties.next;

    expect(next).toMatchObject({
      type: 'object',
      required: ['suggested_calls'],
      properties: { suggested_calls: { type: 'array', items: { required: ['tool', 'arguments', 'why'] } } },
    });
    expect(FIND_SERVICES_OUTPUT_SCHEMA.required).toEqual(['results']);

    const actual = nextOf(await tool.handler({ need: 'upload file' }));
    for (const call of actual?.suggested_calls ?? []) {
      expect(Object.keys(call).sort()).toEqual(['arguments', 'tool', 'why']);
      expect(typeof call.why).toBe('string');
    }
  });
});
