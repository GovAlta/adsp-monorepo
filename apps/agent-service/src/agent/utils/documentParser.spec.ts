import { extractDocumentText, isExtractableDocument } from './documentParser';
import * as xfaExtractor from './xfaExtractor';

jest.mock('./xfaExtractor', () => ({
  extractXfaFields: jest.fn().mockResolvedValue(null),
}));

// Mock pdfjs-dist (used by xfaExtractor; .mjs uses import.meta which Jest cannot handle)
jest.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument: jest.fn(),
}));

// Mock pdf-parse v2 class-based API
const mockGetText = jest.fn();
const mockGetScreenshot = jest.fn();
jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn().mockImplementation(() => ({
    getText: mockGetText,
    getScreenshot: mockGetScreenshot,
    destroy: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('mammoth', () => ({
  convertToHtml: jest.fn().mockResolvedValue({
    value: 'Extracted DOCX text content\nSection 1\nSection 2',
    messages: [],
  }),
  images: {
    imgElement: jest.fn().mockReturnValue({ __mammothBrand: 'ImageConverter' }),
  },
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

    beforeEach(() => {
      mockGetText.mockResolvedValue({
        text: 'Extracted PDF text content\nPage 1\nPage 2',
        total: 2,
        pages: [],
      });
      mockGetScreenshot.mockResolvedValue({
        total: 2,
        pages: [
          { data: new Uint8Array([1, 2, 3]), pageNumber: 1, width: 1024, height: 1325, scale: 1 },
          { data: new Uint8Array([4, 5, 6]), pageNumber: 2, width: 1024, height: 1325, scale: 1 },
        ],
      });
    });

    it('extracts text from PDF', async () => {
      const result = await extractDocumentText(dummyData, 'application/pdf');

      expect(result).not.toBeNull();
      expect(result.text).toContain('Extracted PDF text content');
      expect(result.pageCount).toBe(2);
    });

    it('renders PDF pages as base64 PNG images', async () => {
      const result = await extractDocumentText(dummyData, 'application/pdf');

      expect(result.pageImages).toHaveLength(2);
      expect(result.pageImages[0]).toEqual({
        data: Buffer.from([1, 2, 3]).toString('base64'),
        mimeType: 'image/png',
      });
    });

    it('caps page rendering at 10 pages', async () => {
      mockGetText.mockResolvedValue({ text: 'Extracted text content from a long document', total: 25, pages: [] });

      await extractDocumentText(dummyData, 'application/pdf');

      expect(mockGetScreenshot).toHaveBeenCalledWith(expect.objectContaining({ first: 10 }));
    });

    it('stops adding page renders when the total size cap is reached', async () => {
      const threeMb = new Uint8Array(3 * 1024 * 1024);
      mockGetScreenshot.mockResolvedValue({
        total: 3,
        pages: [
          { data: threeMb, pageNumber: 1, width: 1024, height: 1325, scale: 1 },
          { data: threeMb, pageNumber: 2, width: 1024, height: 1325, scale: 1 },
          { data: threeMb, pageNumber: 3, width: 1024, height: 1325, scale: 1 },
        ],
      });

      const result = await extractDocumentText(dummyData, 'application/pdf');

      // First page (3MB) fits; the second pushes the total past the 4MB cap.
      expect(result.pageImages).toHaveLength(1);
    });

    it('returns text without page images when rendering fails', async () => {
      mockGetScreenshot.mockRejectedValue(new Error('render failed'));

      const result = await extractDocumentText(dummyData, 'application/pdf');

      expect(result).not.toBeNull();
      expect(result.text).toContain('Extracted PDF text content');
      expect(result.pageImages).toBeUndefined();
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

    describe('scanned PDF (no text layer)', () => {
      beforeEach(() => {
        mockGetText.mockResolvedValue({ text: '', total: 3, pages: [] });
        mockGetScreenshot.mockClear();
        // extractXfaFields default mock returns null — no form content found
      });

      it('returns scanned: true when both text and XFA extraction return nothing', async () => {
        const result = await extractDocumentText(dummyData, 'application/pdf');

        expect(result).toEqual({ text: '', pageCount: 3, scanned: true });
        expect(mockGetScreenshot).not.toHaveBeenCalled();
      });
    });

    describe('XFA PDF', () => {
      beforeEach(() => {
        mockGetText.mockResolvedValue({ text: '', total: 2, pages: [] });
        mockGetScreenshot.mockClear();
      });

      it('returns xfaForm: true with extracted content when text is empty', async () => {
        jest.spyOn(xfaExtractor, 'extractXfaFields').mockResolvedValueOnce({ htmlDescription: '<form/>', fields: [] });

        const result = await extractDocumentText(dummyData, 'application/pdf');

        expect(result?.xfaForm).toBe(true);
        expect(result?.scanned).toBeUndefined();
        expect(result?.text).toBe('<form/>');
        expect(result?.format).toBe('html');
      });

      it('does not render page screenshots for XFA PDFs', async () => {
        jest.spyOn(xfaExtractor, 'extractXfaFields').mockResolvedValueOnce({ htmlDescription: '<form/>', fields: [] });

        await extractDocumentText(dummyData, 'application/pdf');

        expect(mockGetScreenshot).not.toHaveBeenCalled();
      });

      it('combines real PDF text with XFA content when both are available (filled form)', async () => {
        mockGetText.mockResolvedValue({ text: 'Filled form content', total: 2, pages: [] });
        jest.spyOn(xfaExtractor, 'extractXfaFields').mockResolvedValueOnce({
          htmlDescription: '## Form Fields\n| sig | signature |',
          fields: [{ name: 'sig', type: 'signature' }],
        });

        const result = await extractDocumentText(dummyData, 'application/pdf');

        expect(result?.xfaForm).toBe(true);
        expect(result?.text).toContain('Filled form content');
        expect(result?.text).toContain('## Form Fields');
        expect(result?.format).toBe('html');
      });

      it('includes placeholder PDF text alongside XFA content when both are present', async () => {
        mockGetText.mockResolvedValue({
          text: 'This Government of Alberta form cannot be opened using your web browser.',
          total: 1,
          pages: [],
        });
        jest.spyOn(xfaExtractor, 'extractXfaFields').mockResolvedValueOnce({ htmlDescription: '<form>structure</form>', fields: [] });

        const result = await extractDocumentText(dummyData, 'application/pdf');

        expect(result?.xfaForm).toBe(true);
        expect(result?.text).toContain('Government of Alberta');
        expect(result?.text).toContain('<form>structure</form>');
      });

      it('returns xfaForm: true with empty text when XFA extraction fails', async () => {
        // extractXfaFields returns null (default mock), text is also empty
        const result = await extractDocumentText(dummyData, 'application/pdf');

        // Both empty → scanned (not xfaForm), since we can no longer distinguish without detection
        expect(result?.scanned).toBe(true);
        expect(result?.xfaForm).toBeUndefined();
      });
    });

    it('treats a normal PDF with short text as regular text, not XFA', async () => {
      mockGetText.mockResolvedValue({ text: 'Page 1', total: 1, pages: [] });
      mockGetScreenshot.mockResolvedValue({ total: 1, pages: [] });
      // extractXfaFields default mock returns null

      const result = await extractDocumentText(dummyData, 'application/pdf');

      expect(result?.text).toBe('Page 1');
      expect(result?.xfaForm).toBeUndefined();
    });
  });
});
