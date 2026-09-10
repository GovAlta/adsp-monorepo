import { DocumentExtractResult } from './documentParser';
import { DOCUMENT_PARSE_CACHE_TTL_MS } from './documentSize';

interface CacheEntry {
  retrievedAt: number;
  result: DocumentExtractResult;
}

const parseCache = new Map<string, CacheEntry>();

export function documentCacheKey(tenantId: string | undefined, fileId: string): string {
  return `${tenantId ?? 'unknown'}:${fileId}`;
}

export async function getCachedDocumentExtract(
  key: string,
  loader: () => Promise<DocumentExtractResult>,
  now: number = Date.now(),
): Promise<DocumentExtractResult> {
  const cached = parseCache.get(key);
  if (cached && now - cached.retrievedAt < DOCUMENT_PARSE_CACHE_TTL_MS) {
    return cached.result;
  }

  const result = await loader();
  parseCache.set(key, { retrievedAt: now, result });
  pruneCache(now);
  return result;
}

export function clearDocumentParseCache(): void {
  parseCache.clear();
}

function pruneCache(now: number): void {
  for (const [key, entry] of parseCache) {
    if (now - entry.retrievedAt >= DOCUMENT_PARSE_CACHE_TTL_MS) {
      parseCache.delete(key);
    }
  }
}
