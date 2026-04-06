import * as mammoth from 'mammoth';
import { isWordDocument, transferWordDocumentToTextFile } from './wordDocument';
import type { Logger } from 'winston';

jest.mock('mammoth', () => ({
  extractRawText: jest.fn(),
}));

const mockedMammoth = mammoth as jest.Mocked<typeof mammoth>;

const warnMock = jest.fn();
const mockLogger = {
  warn: warnMock,
} as unknown as Logger;

describe('wordDocument transfer helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isWordDocument', () => {
    it('returns true for Word mime types', () => {
      expect(isWordDocument('application/msword')).toBe(true);
      expect(isWordDocument('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true);
    });

    it('returns true for Word extensions', () => {
      expect(isWordDocument(undefined, 'test.doc')).toBe(true);
      expect(isWordDocument(undefined, 'test.docx')).toBe(true);
      expect(isWordDocument(undefined, 'TEST.DOCX')).toBe(true);
    });

    it('returns false for non-Word files', () => {
      expect(isWordDocument('application/pdf', 'test.pdf')).toBe(false);
      expect(isWordDocument('text/plain', 'test.txt')).toBe(false);
      expect(isWordDocument()).toBe(false);
    });
  });

  describe('transferWordDocumentToTextFile', () => {
    it('returns undefined when source data url has no payload', async () => {
      const result = await transferWordDocumentToTextFile(mockLogger, 'data:application/msword;base64,', 'form.doc');

      expect(result).toBeUndefined();
      expect(mockedMammoth.extractRawText).not.toHaveBeenCalled();
    });

    it('converts extracted text to text/plain file part and renames extension to txt', async () => {
      mockedMammoth.extractRawText.mockResolvedValueOnce({ value: '  hello world  ' } as never);
      const sourceDataUrl = `data:application/msword;base64,${Buffer.from('fake-word-binary').toString('base64')}`;

      const result = await transferWordDocumentToTextFile(mockLogger, sourceDataUrl, 'sample.docx');

      expect(result).toEqual({
        type: 'file',
        data: `data:text/plain;base64,${Buffer.from('hello world', 'utf8').toString('base64')}`,
        mediaType: 'text/plain',
        filename: 'sample.txt',
      });
      expect(mockedMammoth.extractRawText).toHaveBeenCalledTimes(1);
    });

    it('uses default output filename when source filename is not provided', async () => {
      mockedMammoth.extractRawText.mockResolvedValueOnce({ value: 'content' } as never);
      const sourceDataUrl = `data:application/msword;base64,${Buffer.from('fake-word-binary').toString('base64')}`;

      const result = await transferWordDocumentToTextFile(mockLogger, sourceDataUrl);

      expect(result?.filename).toBe('document.txt');
    });

    it('returns undefined for empty extracted text', async () => {
      mockedMammoth.extractRawText.mockResolvedValueOnce({ value: '   ' } as never);
      const sourceDataUrl = `data:application/msword;base64,${Buffer.from('fake-word-binary').toString('base64')}`;

      const result = await transferWordDocumentToTextFile(mockLogger, sourceDataUrl, 'sample.doc');

      expect(result).toBeUndefined();
    });

    it('returns undefined and logs warning when extraction fails', async () => {
      mockedMammoth.extractRawText.mockRejectedValueOnce(new Error('parse failed'));
      const sourceDataUrl = `data:application/msword;base64,${Buffer.from('fake-word-binary').toString('base64')}`;

      const result = await transferWordDocumentToTextFile(mockLogger, sourceDataUrl, 'sample.doc');

      expect(result).toBeUndefined();
      expect(warnMock).toHaveBeenCalledTimes(1);
    });
  });
});
