import { searchSdkReference } from '../sdk-reference/search';
import { LinkIndex, Related } from './links';
import { createSdkTools } from './registerSdkTools';

function stubLinks(symbolRelated: Record<string, Related> = {}): LinkIndex {
  return {
    relatedForDoc: () => ({}),
    relatedForSymbol: (name) => symbolRelated[name] ?? {},
    docsForService: () => [],
    hasDoc: () => true,
    hasServiceApi: () => true,
  };
}

describe('search_sdk_reference', () => {
  const run = async (query: string, links: LinkIndex = stubLinks()) => {
    const tool = createSdkTools(() => links).find((t) => t.name === 'search_sdk_reference');
    const result = await tool.handler({ query });
    return (result.content[0] as { text: string }).text;
  };

  const related: Record<string, Related> = {
    initializeService: { sdkSymbols: ['initializePlatform', 'ServiceRegistration'], docs: ['services/directory.md'] },
  };

  it("adds each symbol's seeAlso and naming pages as related", async () => {
    const body = JSON.parse(await run('initializeService', stubLinks(related)));

    expect(body.results[0].name).toBe('initializeService');
    expect(body.results[0].related.sdkSymbols).toContain('initializePlatform');
    expect(body.results[0].related.docs).toEqual(['services/directory.md']);
  });

  it('suggests the page naming the top symbol and its first seeAlso', async () => {
    const body = JSON.parse(await run('initializeService', stubLinks(related)));

    expect(body.next.suggested_calls).toEqual([
      {
        tool: 'read_adsp_doc',
        arguments: { path: 'services/directory.md' },
        why: 'Read a page that uses this symbol.',
      },
      {
        tool: 'search_sdk_reference',
        arguments: { query: 'initializePlatform' },
        why: 'Look up a related SDK symbol.',
      },
    ]);
  });

  it('keeps the no-match text unchanged', async () => {
    expect(await run('zzzzqqqq')).toBe(
      'No matching @abgov/adsp-service-sdk symbols found for "zzzzqqqq".',
    );
  });

  it('keeps every existing symbol field', async () => {
    const body = JSON.parse(await run('initializeService', stubLinks(related)));
    const withoutRelated = body.results.map(({ related: _related, ...rest }: Record<string, unknown>) => rest);

    expect(withoutRelated).toEqual(JSON.parse(JSON.stringify(searchSdkReference('initializeService', 5))));
  });
});
