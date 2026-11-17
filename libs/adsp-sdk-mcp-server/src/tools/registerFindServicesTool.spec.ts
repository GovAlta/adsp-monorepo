import { join } from 'path';
import { CapabilityCatalog, loadCapabilityCatalog } from '../capabilities/catalog';
import { createFindServicesTool } from './registerFindServicesTool';

const CATALOG_PATH = join(__dirname, '..', '..', 'assets', 'capabilities.json');

type Result = Record<string, unknown>;

function results(output: { structuredContent?: Record<string, unknown> }): Result[] {
  return (output.structuredContent as { results: Result[] }).results;
}

describe('find_adsp_services', () => {
  let loads: number;
  let tool: ReturnType<typeof createFindServicesTool>[number];

  beforeEach(() => {
    loads = 0;
    [tool] = createFindServicesTool((): CapabilityCatalog => {
      loads += 1;
      return loadCapabilityCatalog(CATALOG_PATH);
    });
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
});
