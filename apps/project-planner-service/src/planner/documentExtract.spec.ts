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
    it.each(['plan.md', 'plan.markdown', 'plan.doc', 'plan.docx', 'plan.pdf', 'PLAN.PDF'])('accepts %s', (filename) => {
      expect(isSupportedProblemStatementFile(filename)).toBe(true);
    });

    it.each(['plan.txt', 'plan.png', 'plan'])('rejects %s', (filename) => {
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
      await expect(extractProblemStatementText(Buffer.from('bytes'), 'plan.txt')).rejects.toThrow(
        'Unsupported file format: .txt.',
      );
    });

    it('extracts text from a Confluence-style HTML export saved with a .doc extension', async () => {
      const html =
        '<html><head><style>.x{}</style></head><body><h1>Title</h1><p>Applicants apply online.</p></body></html>';

      const text = await extractProblemStatementText(Buffer.from(html), 'plan.doc');

      expect(text).toBe('Title\nApplicants apply online.');
    });

    it('extracts text from an MHTML/doctype HTML export with a BOM and decodes entities', async () => {
      const html = '\uFEFF<!DOCTYPE html>\n<html><body><p>Rent &amp; apply &nbsp;today.</p></body></html>';

      const text = await extractProblemStatementText(Buffer.from(html), 'plan.doc');

      expect(text).toBe('Rent & apply today.');
    });

    it('extracts text from a real Confluence "Export to Word" MHTML .doc (quoted-printable multipart)', async () => {
      const mhtml = [
        'Date: Thu, 29 Oct 2026 15:24:59 +0000 (UTC)',
        'Subject: Exported From Confluence',
        'MIME-Version: 1.0',
        'Content-Type: multipart/related; ',
        '        boundary="----=_Part_16_91116745.1793287499678"',
        '',
        '------=_Part_16_91116745.1793287499678',
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: quoted-printable',
        'Content-Location: file:///C:/exported.html',
        '',
        "<html xmlns:o=3D'urn:schemas-microsoft-com:office:office'>",
        '<body><h1>CRM Requirements</h1><p>Applicants apply online.</p></body></html>',
        '------=_Part_16_91116745.1793287499678--',
        '',
      ].join('\r\n');

      const text = await extractProblemStatementText(Buffer.from(mhtml, 'latin1'), 'plan.doc');

      expect(text).toBe('CRM Requirements\nApplicants apply online.');
    });

    it('rejects a legacy binary .doc file that is not an HTML export', async () => {
      const oleHeader = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);

      await expect(extractProblemStatementText(oleHeader, 'plan.doc')).rejects.toThrow(
        'Legacy binary Word (.doc) files are not supported',
      );
    });
  });
});
