import * as path from 'path';
import { createAdspSdkReferenceTools } from './adspSdkReference';

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

// Point at the real repo docs/ folder so tests exercise real search behaviour without
// depending on a prior `nx build agent-service` having populated dist/apps/agent-service/assets/docs.
const REPO_DOCS_ROOT = path.resolve(__dirname, '../../../../../docs');

describe('createAdspSdkReferenceTools', () => {
  const tools = createAdspSdkReferenceTools({ logger: mockLogger as never, docsRoot: REPO_DOCS_ROOT });

  describe('searchAdspDocsTool', () => {
    it('creates a tool with the correct id', () => {
      expect(tools.searchAdspDocsTool.id).toBe('search-adsp-docs');
    });

    it('finds a known doc by keyword', async () => {
      const result = await tools.searchAdspDocsTool.execute({ query: 'send a domain event' } as never, {} as never);
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0].path).toBe('services/event-service.md');
    });

    it('returns an empty array when nothing matches', async () => {
      const result = await tools.searchAdspDocsTool.execute({ query: 'xyznonexistentterm' } as never, {} as never);
      expect(result.results).toEqual([]);
    });

    it('respects the limit parameter', async () => {
      const result = await tools.searchAdspDocsTool.execute({ query: 'service', limit: 2 } as never, {} as never);
      expect(result.results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('readAdspDocTool', () => {
    it('creates a tool with the correct id', () => {
      expect(tools.readAdspDocTool.id).toBe('read-adsp-doc');
    });

    it('returns the full doc for a known path', async () => {
      const result = await tools.readAdspDocTool.execute({ path: 'services/event-service.md' } as never, {} as never);
      expect(result.doc?.title).toBe('Event service');
      expect(result.doc?.content).toContain('domain events');
    });

    it('returns null for an unknown path', async () => {
      const result = await tools.readAdspDocTool.execute({ path: 'does/not-exist.md' } as never, {} as never);
      expect(result.doc).toBeNull();
    });
  });

  describe('searchAdspSdkReferenceTool', () => {
    it('creates a tool with the correct id', () => {
      expect(tools.searchAdspSdkReferenceTool.id).toBe('search-adsp-sdk-reference');
    });

    it('finds a known SDK symbol by name', async () => {
      const result = await tools.searchAdspSdkReferenceTool.execute(
        { query: 'initializeService' } as never,
        {} as never
      );
      expect(result.results[0].name).toBe('initializeService');
    });

    it('returns an empty array when nothing matches', async () => {
      const result = await tools.searchAdspSdkReferenceTool.execute(
        { query: 'xyznonexistentterm' } as never,
        {} as never
      );
      expect(result.results).toEqual([]);
    });
  });
});
