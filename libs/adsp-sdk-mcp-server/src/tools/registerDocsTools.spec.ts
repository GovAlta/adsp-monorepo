import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { DocsRepository } from '../docs/docsRepository';
import { LinkIndex, Related } from './links';
import { createDocsTools } from './registerDocsTools';

const PAGES: Record<string, string> = {
  'services/file-service.md':
    '---\ntitle: File service\n---\nUpload a file with the file service. Files are stored per tenant.',
  'services/event-service.md': '---\ntitle: Event service\n---\nSend a domain event with the event service.',
  'tutorials/files.md': '---\ntitle: File tutorial\n---\nA tutorial about file upload.',
};

function stubLinks(docRelated: Record<string, Related> = {}): LinkIndex {
  return {
    relatedForDoc: (path) => docRelated[path] ?? {},
    relatedForSymbol: () => ({}),
    docsForService: () => [],
    hasDoc: () => true,
    hasServiceApi: () => true,
  };
}

describe('docs tools', () => {
  let root: string;
  let docs: DocsRepository;

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'docs-tools-'));
    for (const [path, content] of Object.entries(PAGES)) {
      mkdirSync(join(root, path, '..'), { recursive: true });
      writeFileSync(join(root, path), content);
    }
    docs = new DocsRepository(root);
  });

  afterAll(() => rmSync(root, { recursive: true, force: true }));

  const tool = (name: string, links: LinkIndex = stubLinks()) =>
    createDocsTools(docs, () => links).find((t) => t.name === name);
  const textOf = (result: { content: unknown[] }, index = 0) => (result.content[index] as { text: string }).text;

  describe('search_adsp_docs', () => {
    it('wraps search results with related and next, keeping every existing field', async () => {
      const links = stubLinks({
        'services/file-service.md': { sdkSymbols: ['FileService'], serviceApis: ['file-service'] },
      });
      const result = await tool('search_adsp_docs', links).handler({ query: 'file upload' });
      const body = JSON.parse(textOf(result));

      expect(body.results[0]).toEqual({
        ...docs.search('file upload', 5)[0],
        related: { sdkSymbols: ['FileService'], serviceApis: ['file-service'] },
      });
      expect(body.next.suggested_calls[0]).toEqual({
        tool: 'read_adsp_doc',
        arguments: { path: body.results[0].path },
        why: 'Top match; read the full page.',
      });
    });

    it('adds related to the top result only', async () => {
      const links = stubLinks({
        'services/file-service.md': { serviceApis: ['file-service'] },
        'services/event-service.md': { serviceApis: ['event-service'] },
        'tutorials/files.md': { serviceApis: ['file-service'] },
      });
      const result = await tool('search_adsp_docs', links).handler({ query: 'file service event tutorial upload' });
      const { results } = JSON.parse(textOf(result));

      expect(results.length).toBeGreaterThan(2);
      expect(results.map((entry: { related?: unknown }) => entry.related !== undefined)).toEqual(
        results.map((_: unknown, position: number) => position < 1),
      );
    });

    it('suggests the endpoint search for a service page', async () => {
      const links = stubLinks({ 'services/file-service.md': { serviceApis: ['file-service'] } });
      const result = await tool('search_adsp_docs', links).handler({ query: 'file upload' });

      expect(JSON.parse(textOf(result)).next.suggested_calls[1]).toMatchObject({
        tool: 'search_service_endpoints',
        arguments: { query: 'file upload', service: 'file-service' },
      });
    });

    it('copies the query into the endpoint suggestion unchanged', async () => {
      const query = 'send "domain" event\nnow ü';
      const links = stubLinks({ 'services/event-service.md': { serviceApis: ['event-service'] } });
      const result = await tool('search_adsp_docs', links).handler({ query });

      expect(JSON.parse(textOf(result)).next.suggested_calls[1].arguments).toEqual({ query, service: 'event-service' });
    });

    it('keeps the no-match and common-words texts unchanged', async () => {
      const search = tool('search_adsp_docs');

      expect(textOf(await search.handler({ query: 'the of and' }))).toBe(
        '"the of and" has only common words such as "how" or "the", so there is nothing to search for. ' +
          'Use a service or feature name, e.g. "send a domain event", or call list_adsp_docs to browse.',
      );
      expect(textOf(await search.handler({ query: 'kubernetes' }))).toBe(
        'No ADSP docs match "kubernetes". Try other keywords, or call list_adsp_docs to browse.',
      );
    });
  });

  describe('list_adsp_docs', () => {
    it('wraps the list in results and suggests reading the only page under a narrow prefix', async () => {
      const result = await tool('list_adsp_docs').handler({ prefix: 'services/event' });

      expect(JSON.parse(textOf(result))).toEqual({
        results: [{ path: 'services/event-service.md', title: 'Event service' }],
        next: {
          suggested_calls: [
            {
              tool: 'read_adsp_doc',
              arguments: { path: 'services/event-service.md' },
              why: 'Only page under this prefix; read it.',
            },
          ],
        },
      });
    });

    it('prints one page per line so the wrapper adds little to a long list', async () => {
      const text = textOf(await tool('list_adsp_docs').handler({}));

      expect(text).toContain('{"path":"services/event-service.md","title":"Event service"}');
      expect(text.split('\n')).toHaveLength(7);
      expect(JSON.parse(text).results).toHaveLength(3);
    });

    it('does not suggest a page for an unfiltered list', async () => {
      const body = JSON.parse(textOf(await tool('list_adsp_docs').handler({})));

      expect(body.results).toHaveLength(3);
      expect(body.next).toBeUndefined();
    });
  });

  describe('read_adsp_doc', () => {
    it('keeps the page markdown as the first block and adds related and next as a second', async () => {
      const links = stubLinks({
        'services/file-service.md': {
          docs: ['tutorials/files.md'],
          sdkSymbols: ['FileService'],
          serviceApis: ['file-service'],
        },
      });
      const result = await tool('read_adsp_doc', links).handler({ path: 'services/file-service.md' });

      expect(result.content).toHaveLength(2);
      expect(textOf(result)).toBe(`# File service\n\n${docs.read('services/file-service.md').content}`);
      const second = JSON.parse(textOf(result, 1));
      expect(second.path).toBe('services/file-service.md');
      expect(second.related).toEqual({
        docs: ['tutorials/files.md'],
        sdkSymbols: ['FileService'],
        serviceApis: ['file-service'],
      });
      expect(
        second.next.suggested_calls.map((c: { tool: string; arguments: unknown }) => [c.tool, c.arguments]),
      ).toEqual([
        ['search_service_endpoints', { query: 'File service', service: 'file-service' }],
        ['search_sdk_reference', { query: 'FileService' }],
        ['read_adsp_doc', { path: 'tutorials/files.md' }],
      ]);
    });

    it('gives only the path when nothing is related', async () => {
      const result = await tool('read_adsp_doc').handler({ path: 'services/file-service.md' });

      expect(JSON.parse(textOf(result, 1))).toEqual({ path: 'services/file-service.md' });
    });

    it('keeps the unknown-path error unchanged', async () => {
      const result = await tool('read_adsp_doc').handler({ path: 'nope.md' });

      expect(result).toEqual({
        isError: true,
        content: [
          {
            type: 'text',
            text: 'No doc found at path "nope.md". Use search_adsp_docs or list_adsp_docs to find a valid path.',
          },
        ],
      });
    });
  });
});
