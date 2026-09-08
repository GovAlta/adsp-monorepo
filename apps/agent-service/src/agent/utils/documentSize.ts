export const FORM_GENERATION_LARGE_CHAR_COUNT = 8000;
export const FORM_GENERATION_LARGE_PAGE_COUNT = 4;
export const FORM_GENERATION_MAX_PAGE_IMAGES = 3;
export const DOCUMENT_EXTRACT_CHAR_CAP = 16000;
export const OUTLINE_SECTION_CHAR_CAP = 12000;
export const DOCUMENT_PARSE_CACHE_TTL_MS = 10 * 60 * 1000;

export function isLargeFormDocument(charCount: number, pageCount?: number): boolean {
  return charCount >= FORM_GENERATION_LARGE_CHAR_COUNT || (pageCount ?? 0) >= FORM_GENERATION_LARGE_PAGE_COUNT;
}

export function truncateText(text: string, maxChars: number): { text: string; truncated: boolean } {
  if (text.length <= maxChars) {
    return { text, truncated: false };
  }
  return { text: text.slice(0, maxChars), truncated: true };
}
