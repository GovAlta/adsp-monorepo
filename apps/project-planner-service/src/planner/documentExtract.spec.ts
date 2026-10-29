const mockGetText = jest.fn();
const mockDestroy = jest.fn().mockResolvedValue(undefined);
jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn().mockImplementation(() => ({
    getText: mockGetText,
    destroy: mockDestroy,
  })),
}));

const mockExtractRawText = jest.fn();
jest.mock('mammoth', () => ({
  extractRawText: (...args: unknown[]) => mockExtractRawText(...args),
}));

import { extractProblemStatementText, isSupportedProblemStatementFile } from './documentExtract';

describe('documentExtract', () => {
  afterEach(() => jest.clearAllMocks());

  describe('isSupportedProblemStatementFile', () => {
    it.each(['plan.md', 'plan.markdown', 'plan.docx', 'plan.pdf', 'PLAN.PDF'])('accepts %s', (filename) => {
      expect(isSupportedProblemStatementFile(filename)).toBe(true);
    });

    it.each(['plan.doc', 'plan.txt', 'plan.png', 'plan'])('rejects %s', (filename) => {
      expect(isSupportedProblemStatementFile(filename)).toBe(false);
    });
  });

  describe('extractProblemStatementText', () => {
    it('reads markdown files as plain text', async () => {
      const text = await extractProblemStatementText(Buffer.from('  # Problem\nApplicants apply online.  '), 'plan.md');

      expect(text).toBe('# Problem\nApplicants apply online.');
    });

    it('extracts raw text from docx files', async () => {
      mockExtractRawText.mockResolvedValue({ value: 'Applicants apply online.  ' });

      const text = await extractProblemStatementText(Buffer.from('docx-bytes'), 'plan.docx');

      expect(text).toBe('Applicants apply online.');
      expect(mockExtractRawText).toHaveBeenCalledWith({ buffer: expect.any(Buffer) });
    });

    it('extracts text from pdf files and destroys the parser', async () => {
      mockGetText.mockResolvedValue({ text: 'Applicants apply online.  ' });

      const text = await extractProblemStatementText(Buffer.from('pdf-bytes'), 'plan.pdf');

      expect(text).toBe('Applicants apply online.');
      expect(mockDestroy).toHaveBeenCalled();
    });

    it('destroys the pdf parser even when text extraction fails', async () => {
      mockGetText.mockRejectedValue(new Error('corrupt pdf'));

      await expect(extractProblemStatementText(Buffer.from('pdf-bytes'), 'plan.pdf')).rejects.toThrow('corrupt pdf');
      expect(mockDestroy).toHaveBeenCalled();
    });

    it('returns an empty string for a scanned/image-only pdf with no text layer', async () => {
      mockGetText.mockResolvedValue({ text: '' });

      const text = await extractProblemStatementText(Buffer.from('pdf-bytes'), 'plan.pdf');

      expect(text).toBe('');
    });

    it('throws for an unsupported extension', async () => {
      await expect(extractProblemStatementText(Buffer.from('bytes'), 'plan.doc')).rejects.toThrow(
        'Unsupported file format: .doc.',
      );
    });
  });
});
