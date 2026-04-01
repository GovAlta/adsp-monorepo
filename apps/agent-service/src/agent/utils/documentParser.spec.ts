import { extractDocumentText, isExtractableDocument } from './documentParser';

// Mock pdfjs-dist (used by xfaExtractor; .mjs uses import.meta which Jest cannot handle)
jest.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument: jest.fn(),
}));

// Mock pdf2json (used by xfaExtractor as fallback)
jest.mock('pdf2json', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    parseBuffer: jest.fn(),
  }));
});

// Mock pdf-parse v2 class-based API
jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn().mockImplementation(() => ({
    getText: jest.fn().mockResolvedValue({
      text: 'Extracted PDF text content\nPage 1\nPage 2',
      total: 2,
      pages: [],
    }),
    destroy: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('mammoth', () => ({
  extractRawText: jest.fn().mockResolvedValue({
    value: 'Extracted DOCX text content\nSection 1\nSection 2',
    messages: [],
  }),
}));

describe('documentParser', () => {
  describe('isExtractableDocument', () => {
    it('returns true for application/pdf', () => {
      expect(isExtractableDocument('application/pdf')).toBe(true);
    });

    it('returns true for DOCX mime type', () => {
      expect(isExtractableDocument('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(
        true,
      );
    });

    it('returns false for image/png', () => {
      expect(isExtractableDocument('image/png')).toBe(false);
    });

    it('returns false for text/plain', () => {
      expect(isExtractableDocument('text/plain')).toBe(false);
    });
  });

  describe('extractDocumentText', () => {
    const dummyData = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF

    it('extracts text from PDF', async () => {
      const result = await extractDocumentText(dummyData, 'application/pdf');

      expect(result).not.toBeNull();
      expect(result.text).toContain('Extracted PDF text content');
      expect(result.pageCount).toBe(2);
    });

    it('extracts text from DOCX', async () => {
      const result = await extractDocumentText(
        dummyData,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );

      expect(result).not.toBeNull();
      expect(result.text).toContain('Extracted DOCX text content');
      expect(result.pageCount).toBeUndefined();
    });

    it('returns null for unsupported mime type', async () => {
      const result = await extractDocumentText(dummyData, 'image/png');
      expect(result).toBeNull();
    });

    it('returns null for text/plain', async () => {
      const result = await extractDocumentText(dummyData, 'text/plain');
      expect(result).toBeNull();
    });
  });
});
