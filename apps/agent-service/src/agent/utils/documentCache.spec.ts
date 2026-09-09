import { clearDocumentParseCache, documentCacheKey, getCachedDocumentExtract } from './documentCache';

describe('getCachedDocumentExtract', () => {
  afterEach(() => {
    clearDocumentParseCache();
  });

  it('reuses a cached parse within the TTL', async () => {
    const loader = jest.fn().mockResolvedValue({ text: 'once' });

    const first = await getCachedDocumentExtract(documentCacheKey('tenant-a', 'file-1'), loader, 1_000);
    const second = await getCachedDocumentExtract(documentCacheKey('tenant-a', 'file-1'), loader, 2_000);

    expect(first.text).toBe('once');
    expect(second.text).toBe('once');
    expect(loader).toHaveBeenCalledTimes(1);
  });
});
