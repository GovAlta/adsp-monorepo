import { Readable } from 'stream';
import { Logger } from 'winston';
import { fileTypeFromBuffer } from 'file-type';
import { FileTypeDetector } from './fileTypeDetector';

jest.mock('file-type', () => ({
  fileTypeFromBuffer: jest.fn(),
}));

describe('FileTypeDetector', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const fileTypeFromBufferMock = fileTypeFromBuffer as jest.Mock;

  const createStream = () => {
    const stream = new Readable();
    stream._read = () => {
      /* data is pushed by emitting events */
    };
    return stream;
  };

  const detectWith = async (content: Buffer, filename?: string) => {
    const stream = createStream();
    const detector = new FileTypeDetector(logger, stream, filename);

    const result = detector.detect();
    stream.emit('data', content);
    stream.emit('end');

    return result;
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('can be created', () => {
    const detector = new FileTypeDetector(logger, createStream());

    expect(detector).toBeTruthy();
  });

  it('returns the file type detected from the content', async () => {
    fileTypeFromBufferMock.mockResolvedValueOnce({ mime: 'application/pdf', ext: 'pdf' });

    const result = await detectWith(Buffer.from('%PDF-1.7'), 'report.pdf');

    expect(result.fileType).toEqual({ mime: 'application/pdf', ext: 'pdf' });
  });

  it('detects the file type from the concatenation of all chunks', async () => {
    fileTypeFromBufferMock.mockResolvedValueOnce({ mime: 'application/pdf', ext: 'pdf' });
    const stream = createStream();
    const detector = new FileTypeDetector(logger, stream, 'report.pdf');

    const result = detector.detect();
    stream.emit('data', Buffer.from('%PDF'));
    stream.emit('data', Buffer.from('-1.7'));
    stream.emit('end');
    await result;

    expect(fileTypeFromBufferMock).toHaveBeenCalledWith(Buffer.from('%PDF-1.7'));
  });

  it('returns a stream that replays the content', async () => {
    fileTypeFromBufferMock.mockResolvedValueOnce({ mime: 'application/pdf', ext: 'pdf' });

    const result = await detectWith(Buffer.from('%PDF-1.7'), 'report.pdf');
    const chunks: Buffer[] = [];
    for await (const chunk of result.fileStream) {
      chunks.push(chunk);
    }

    expect(Buffer.concat(chunks).toString()).toBe('%PDF-1.7');
  });

  it('logs the detected mime type', async () => {
    fileTypeFromBufferMock.mockResolvedValueOnce({ mime: 'image/png', ext: 'png' });

    await detectWith(Buffer.from('png-content'), 'photo.png');

    expect(logger.debug).toHaveBeenCalledWith('File type as determined: image/png');
  });

  it('does not write to the console', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    fileTypeFromBufferMock.mockResolvedValueOnce({ mime: 'image/png', ext: 'png' });

    await detectWith(Buffer.from('png-content'), 'photo.png');

    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  describe('text fallback', () => {
    test.each([
      ['notes.txt', 'text/plain', 'txt'],
      ['server.log', 'text/plain', 'log'],
      ['participants.csv', 'text/csv', 'csv'],
      ['participants.tsv', 'text/tab-separated-values', 'tsv'],
      ['payload.json', 'application/json', 'json'],
      ['feed.xml', 'application/xml', 'xml'],
      ['README.md', 'text/markdown', 'md'],
    ])('detects %s as %s when content is text', async (filename, mime, ext) => {
      fileTypeFromBufferMock.mockResolvedValueOnce(undefined);

      const result = await detectWith(Buffer.from('name,status\nJane Doe,active'), filename);

      expect(result.fileType).toEqual({ mime, ext });
    });

    it('matches the file extension case-insensitively', async () => {
      fileTypeFromBufferMock.mockResolvedValueOnce(undefined);

      const result = await detectWith(Buffer.from('name,status'), 'PARTICIPANTS.CSV');

      expect(result.fileType).toEqual({ mime: 'text/csv', ext: 'csv' });
    });

    test.each([['page.html'], ['logo.svg']])('does not detect %s as text', async (filename) => {
      fileTypeFromBufferMock.mockResolvedValueOnce(undefined);

      const result = await detectWith(Buffer.from('<p>hello</p>'), filename);

      expect(result.fileType).toBeUndefined();
    });

    it('does not detect a type when no filename is provided', async () => {
      fileTypeFromBufferMock.mockResolvedValueOnce(undefined);

      const result = await detectWith(Buffer.from('plain text'));

      expect(result.fileType).toBeUndefined();
    });

    it('does not detect a type when the filename has no extension', async () => {
      fileTypeFromBufferMock.mockResolvedValueOnce(undefined);

      const result = await detectWith(Buffer.from('plain text'), 'LICENSE');

      expect(result.fileType).toBeUndefined();
    });

    it('does not detect a text type for empty content', async () => {
      fileTypeFromBufferMock.mockResolvedValueOnce(undefined);

      const result = await detectWith(Buffer.alloc(0), 'notes.txt');

      expect(result.fileType).toBeUndefined();
    });

    it('does not detect a text type when content contains a null byte', async () => {
      fileTypeFromBufferMock.mockResolvedValueOnce(undefined);

      const result = await detectWith(Buffer.from([0x68, 0x69, 0x00, 0x21]), 'notes.txt');

      expect(result.fileType).toBeUndefined();
    });

    it('does not detect a text type when content is not valid UTF-8', async () => {
      fileTypeFromBufferMock.mockResolvedValueOnce(undefined);

      const result = await detectWith(Buffer.from([0xff, 0xfe, 0xfd]), 'notes.txt');

      expect(result.fileType).toBeUndefined();
    });

    it('tolerates a multi-byte character split by the sample boundary', async () => {
      fileTypeFromBufferMock.mockResolvedValueOnce(undefined);
      const content = Buffer.concat([Buffer.alloc(8191, 'a'), Buffer.from('é')]);

      const result = await detectWith(content, 'notes.txt');

      expect(result.fileType).toEqual({ mime: 'text/plain', ext: 'txt' });
    });

    it('prefers the content-based type over the text fallback', async () => {
      fileTypeFromBufferMock.mockResolvedValueOnce({ mime: 'application/pdf', ext: 'pdf' });

      const result = await detectWith(Buffer.from('%PDF-1.7'), 'notes.txt');

      expect(result.fileType).toEqual({ mime: 'application/pdf', ext: 'pdf' });
    });
  });

  describe('failures', () => {
    it('rejects when the source stream emits an error', async () => {
      const stream = createStream();
      const detector = new FileTypeDetector(logger, stream, 'report.pdf');

      const result = detector.detect();
      stream.emit('error', new Error('stream failure'));

      await expect(result).rejects.toThrow('stream failure');
    });

    it('rejects when file type detection fails', async () => {
      fileTypeFromBufferMock.mockRejectedValueOnce(new Error('detection failure'));

      const result = detectWith(Buffer.from('a buffer'), 'report.pdf');

      await expect(result).rejects.toThrow('detection failure');
    });
  });
});
