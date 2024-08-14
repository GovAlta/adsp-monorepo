import { Logger } from 'winston';

import { FileTypeDetector } from './fileTypeDetector';
import { Readable } from 'stream';
import * as detectFileType from 'detect-file-type';

describe('File type detector', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const stream = new Readable();
  const multerFile = { stream: stream };

  jest.mock('detect-file-type', () => ({
    fromBuffer: jest.fn(),
  }));

  let fileTypeDetector;

  it('can be created', () => {
    const fileTypeDetector = new FileTypeDetector(logger, multerFile.stream);

    expect(fileTypeDetector).toBeTruthy();
  });

  it('can detect', () => {
    const mockedStream = new Readable();

    mockedStream._read = function (_size) {
      /* do nothing */
    };

    const fileTypeDetector = new FileTypeDetector(logger, mockedStream);

    expect(fileTypeDetector.detect()).toBeTruthy();
    mockedStream.emit('data', Buffer.from('a buffer'));
    mockedStream.emit('end');
  });

  it('can detect and return a filetype', () => {
    const mockedStream = new Readable();

    mockedStream._read = function (_size) {
      /* do nothing */
    };

    const fileTypeDetector = new FileTypeDetector(logger, mockedStream);

    const fromBufferSpy = jest.spyOn(detectFileType, 'fromBuffer');
    fromBufferSpy.mockImplementationOnce((_, callback) => {
      callback(null, { mime: 'abc' });
    });

    expect(fileTypeDetector.detect()).toBeTruthy();
    mockedStream.emit('data', Buffer.from('a buffer'));
    mockedStream.emit('end');
  });

  it('deals with failing buffer', () => {
    const mockedStream = new Readable();

    mockedStream._read = function (_size) {
      /* do nothing */
    };

    fileTypeDetector = new FileTypeDetector(logger, mockedStream);

    expect(fileTypeDetector.detect()).rejects.toEqual('bad bad');

    mockedStream.emit('error', 'bad bad');
    mockedStream.emit('end');
  });

  let content;

  beforeEach(() => {
    content = new Readable();
    fileTypeDetector = new FileTypeDetector(logger, content);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle error from detect.fromBuffer', async () => {
    const error = new Error('test error');
    const mockedStream = new Readable();
    const fileTypeDetector = new FileTypeDetector(logger, mockedStream);
    const fromBufferSpy = jest.spyOn(detectFileType, 'fromBuffer');
    fromBufferSpy.mockImplementationOnce((_, callback) => {
      callback(error);
    });

    expect(fileTypeDetector.detect()).rejects.toEqual(new Error('test error'));
    mockedStream.emit('data', Buffer.from('a buffer'));
    mockedStream.emit('end');
  });

  it('read', async () => {
    const error = new Error('test error');
    const mockedStream = new Readable();
    const fileTypeDetector = new FileTypeDetector(logger, mockedStream);

    const fromBufferSpy = jest.spyOn(detectFileType, 'fromBuffer');
    fromBufferSpy.mockImplementationOnce((_, callback) => {
      callback(error);
    });

    expect(fileTypeDetector.detect()).rejects.toEqual(new Error('test error'));
    mockedStream.emit('data', Buffer.from('a buffer'));
    mockedStream.emit('end');
  });
});
