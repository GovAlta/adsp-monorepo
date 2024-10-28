import { AdspId, adspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { Readable } from 'stream';
import { Logger } from 'winston';
import { ExportCompletedDefinition, ExportFailedDefinition } from '../events';
import { createExportJob } from './export';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('export', () => {
  const serviceId = adspId`urn:ads:platform:test-service`;
  const apiId = adspId`${serviceId}:v1`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const directoryMock = {
    getServiceUrl: jest.fn(),
    getResourceUrl: jest.fn(),
  };

  const tokenProviderMock = {
    getAccessToken: jest.fn(() => Promise.resolve('token')),
  };

  const repositoryMock = {
    create: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const eventServiceMock = {
    send: jest.fn(),
  };

  const fileServiceMock = {
    typeExists: jest.fn(),
    upload: jest.fn(),
  };

  beforeEach(() => {
    axiosMock.get.mockReset();
    directoryMock.getResourceUrl.mockClear();
    fileServiceMock.upload.mockClear();
    eventServiceMock.send.mockClear();
    repositoryMock.update.mockClear();
  });

  it('can create export job', () => {
    const job = createExportJob({
      logger: loggerMock,
      directory: directoryMock,
      tokenProvider: tokenProviderMock,
      eventService: eventServiceMock,
      repository: repositoryMock,
      fileService: fileServiceMock,
    });
    expect(job).toBeTruthy();
  });

  it('can process export json', async () => {
    const job = createExportJob({
      logger: loggerMock,
      directory: directoryMock,
      tokenProvider: tokenProviderMock,
      eventService: eventServiceMock,
      repository: repositoryMock,
      fileService: fileServiceMock,
    });

    directoryMock.getResourceUrl.mockResolvedValue(new URL('http://test-service/test/v1/tests'));
    axiosMock.get.mockResolvedValueOnce({
      data: {
        results: [
          { id: 'test-1', name: 'Test 1', extra: { nested: true } },
          { id: 'test-2', name: 'Test 2', other: { deep: { nested: 'value' } } },
        ],
        page: {},
      },
    });

    const result = {
      id: 'exported-1',
      urn: 'urn:ads:platform:file-service:v1:/files/exported-1',
      filename: 'exported.csv',
    };
    const decoder = new TextDecoder();
    let exported = '';
    fileServiceMock.upload.mockImplementationOnce(
      async (_tenantId, _fileType, _recordId, _filename, content: Readable) => {
        return new Promise((resolve, reject) => {
          content.on('data', (chunk: unknown) => {
            exported += decoder.decode(chunk as Buffer);
          });
          content.on('error', (err) => reject(err));
          content.on('end', () => resolve(result));
          content.read();
        });
      }
    );

    const item = {
      tenantId: tenantId.toString(),
      jobId: 'export-1',
      timestamp: new Date(),
      resourceId: adspId`${apiId}:/tests`.toString(),
      requestedBy: { id: 'tester', name: 'Tester' },
      params: {},
      filename: 'exported',
      fileType: 'export',
      format: 'json',
      formatOptions: {},
    };
    await job(item);

    expect(exported).toBe(
      '[\n  {"id":"test-1","name":"Test 1","extra":{"nested":true}},\n  {"id":"test-2","name":"Test 2","other":{"deep":{"nested":"value"}}}\n]\n'
    );
    expect(fileServiceMock.upload).toHaveBeenCalledWith(
      expect.any(AdspId),
      item.fileType,
      item.resourceId,
      item.filename + '.json',
      expect.any(Readable)
    );
    expect(repositoryMock.update).toHaveBeenCalledWith('export-1', 'completed', result);
    expect(eventServiceMock.send).toHaveBeenCalledWith(
      expect.objectContaining({ name: ExportCompletedDefinition.name })
    );
  });

  it('can process export csv', async () => {
    const job = createExportJob({
      logger: loggerMock,
      directory: directoryMock,
      tokenProvider: tokenProviderMock,
      eventService: eventServiceMock,
      repository: repositoryMock,
      fileService: fileServiceMock,
    });

    directoryMock.getResourceUrl.mockResolvedValue(new URL('http://test-service/test/v1/tests'));
    axiosMock.get.mockResolvedValueOnce({
      data: {
        results: [
          { id: 'test-1', name: 'Test 1', extra: { nested: true } },
          { id: 'test-2', name: 'Test 2', other: { deep: { nested: 'value' } } },
        ],
        page: {},
      },
    });

    const result = {
      id: 'exported-1',
      urn: 'urn:ads:platform:file-service:v1:/files/exported-1',
      filename: 'exported.csv',
    };
    const decoder = new TextDecoder();
    let exported = '';
    fileServiceMock.upload.mockImplementationOnce(
      async (_tenantId, _fileType, _recordId, _filename, content: Readable) => {
        return new Promise((resolve, reject) => {
          content.on('data', (chunk: unknown) => {
            exported += decoder.decode(chunk as Buffer);
          });
          content.on('error', (err) => reject(err));
          content.on('end', () => resolve(result));
          content.read();
        });
      }
    );

    const item = {
      tenantId: tenantId.toString(),
      jobId: 'export-1',
      timestamp: new Date(),
      resourceId: adspId`${apiId}:/tests`.toString(),
      requestedBy: { id: 'tester', name: 'Tester' },
      params: {},
      filename: 'exported',
      fileType: 'export',
      format: 'csv',
      formatOptions: { columns: ['id', 'name', 'extra.nested', 'other.deep.nested'] },
    };
    await job(item);

    expect(exported).toBe('id,name,extra.nested,other.deep.nested\ntest-1,Test 1,1,\ntest-2,Test 2,,value\n');
    expect(fileServiceMock.upload).toHaveBeenCalledWith(
      expect.any(AdspId),
      item.fileType,
      item.resourceId,
      item.filename + '.csv',
      expect.any(Readable)
    );
    expect(repositoryMock.update).toHaveBeenCalledWith('export-1', 'completed', result);
    expect(eventServiceMock.send).toHaveBeenCalledWith(
      expect.objectContaining({ name: ExportCompletedDefinition.name })
    );
  });

  it('can retry on request failure', async () => {
    const job = createExportJob({
      logger: loggerMock,
      directory: directoryMock,
      tokenProvider: tokenProviderMock,
      eventService: eventServiceMock,
      repository: repositoryMock,
      fileService: fileServiceMock,
    });

    directoryMock.getResourceUrl.mockResolvedValue(new URL('http://test-service/test/v1/tests'));
    axiosMock.get.mockRejectedValueOnce(new Error('oh noes!')).mockResolvedValueOnce({
      data: {
        results: [
          { id: 'test-1', name: 'Test 1' },
          { id: 'test-2', name: 'Test 2' },
        ],
        page: {},
      },
    });

    const result = {
      id: 'exported-1',
      urn: 'urn:ads:platform:file-service:v1:/files/exported-1',
      filename: 'exported.csv',
    };
    const decoder = new TextDecoder();
    let exported = '';
    fileServiceMock.upload.mockImplementationOnce(
      async (_tenantId, _fileType, _recordId, _filename, content: Readable) => {
        return new Promise((resolve, reject) => {
          content.on('data', (chunk: unknown) => {
            exported += decoder.decode(chunk as Buffer);
          });
          content.on('error', (err) => reject(err));
          content.on('end', () => resolve(result));
          content.read();
        });
      }
    );

    const item = {
      tenantId: tenantId.toString(),
      jobId: 'export-1',
      timestamp: new Date(),
      resourceId: adspId`${apiId}:/tests`.toString(),
      requestedBy: { id: 'tester', name: 'Tester' },
      params: {},
      filename: 'exported',
      fileType: 'export',
      format: 'json',
      formatOptions: {},
    };
    await job(item);

    expect(exported).toBe('[\n  {"id":"test-1","name":"Test 1"},\n  {"id":"test-2","name":"Test 2"}\n]\n');
    expect(fileServiceMock.upload).toHaveBeenCalledWith(
      expect.any(AdspId),
      item.fileType,
      item.resourceId,
      item.filename + '.json',
      expect.any(Readable)
    );
    expect(repositoryMock.update).toHaveBeenCalledWith('export-1', 'completed', result);
    expect(eventServiceMock.send).toHaveBeenCalledWith(
      expect.objectContaining({ name: ExportCompletedDefinition.name })
    );
  });

  it('can handle request failure', async () => {
    const job = createExportJob({
      logger: loggerMock,
      directory: directoryMock,
      tokenProvider: tokenProviderMock,
      eventService: eventServiceMock,
      repository: repositoryMock,
      fileService: fileServiceMock,
    });

    directoryMock.getResourceUrl.mockResolvedValue(new URL('http://test-service/test/v1/tests'));
    axiosMock.get.mockRejectedValue(new Error('oh noes!'));

    const item = {
      tenantId: tenantId.toString(),
      jobId: 'export-1',
      timestamp: new Date(),
      resourceId: adspId`${apiId}:/tests`.toString(),
      requestedBy: { id: 'tester', name: 'Tester' },
      params: {},
      filename: 'exported',
      fileType: 'export',
      format: 'json',
      formatOptions: {},
    };
    await job(item);

    expect(fileServiceMock.upload).not.toHaveBeenCalled();
    expect(repositoryMock.update).toHaveBeenCalledWith('export-1', 'failed');
    expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: ExportFailedDefinition.name }));
  });

  it('can process export paged results', async () => {
    const job = createExportJob({
      logger: loggerMock,
      directory: directoryMock,
      tokenProvider: tokenProviderMock,
      eventService: eventServiceMock,
      repository: repositoryMock,
      fileService: fileServiceMock,
    });

    directoryMock.getResourceUrl.mockResolvedValue(new URL('http://test-service/test/v1/tests'));
    axiosMock.get
      .mockResolvedValueOnce({
        data: {
          results: [{ id: 'test-1', name: 'Test 1' }],
          page: {
            next: '2',
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          results: [{ id: 'test-2', name: 'Test 2' }],
          page: {},
        },
      });

    const result = {
      id: 'exported-1',
      urn: 'urn:ads:platform:file-service:v1:/files/exported-1',
      filename: 'exported.csv',
    };
    const decoder = new TextDecoder();
    let exported = '';
    fileServiceMock.upload.mockImplementationOnce(
      async (_tenantId, _fileType, _recordId, _filename, content: Readable) => {
        return new Promise((resolve, reject) => {
          content.on('data', (chunk: unknown) => {
            exported += decoder.decode(chunk as Buffer);
          });
          content.on('error', (err) => reject(err));
          content.on('end', () => resolve(result));
          content.read();
        });
      }
    );

    const item = {
      tenantId: tenantId.toString(),
      jobId: 'export-1',
      timestamp: new Date(),
      resourceId: adspId`${apiId}:/tests`.toString(),
      requestedBy: { id: 'tester', name: 'Tester' },
      params: {},
      filename: 'exported',
      fileType: 'export',
      format: 'json',
      formatOptions: {},
    };
    await job(item);

    expect(exported).toBe('[\n  {"id":"test-1","name":"Test 1"},\n  {"id":"test-2","name":"Test 2"}\n]\n');
    expect(fileServiceMock.upload).toHaveBeenCalledWith(
      expect.any(AdspId),
      item.fileType,
      item.resourceId,
      item.filename + '.json',
      expect.any(Readable)
    );
    expect(repositoryMock.update).toHaveBeenCalledWith('export-1', 'completed', result);
    expect(eventServiceMock.send).toHaveBeenCalledWith(
      expect.objectContaining({ name: ExportCompletedDefinition.name })
    );
  });

  it('can process export array results', async () => {
    const job = createExportJob({
      logger: loggerMock,
      directory: directoryMock,
      tokenProvider: tokenProviderMock,
      eventService: eventServiceMock,
      repository: repositoryMock,
      fileService: fileServiceMock,
    });

    directoryMock.getResourceUrl.mockResolvedValue(new URL('http://test-service/test/v1/tests'));
    axiosMock.get.mockResolvedValueOnce({
      data: [
        { id: 'test-1', name: 'Test 1' },
        { id: 'test-2', name: 'Test 2' },
      ],
    });

    const result = {
      id: 'exported-1',
      urn: 'urn:ads:platform:file-service:v1:/files/exported-1',
      filename: 'exported.csv',
    };
    const decoder = new TextDecoder();
    let exported = '';
    fileServiceMock.upload.mockImplementationOnce(
      async (_tenantId, _fileType, _recordId, _filename, content: Readable) => {
        return new Promise((resolve, reject) => {
          content.on('data', (chunk: unknown) => {
            exported += decoder.decode(chunk as Buffer);
          });
          content.on('error', (err) => reject(err));
          content.on('end', () => resolve(result));
          content.read();
        });
      }
    );

    const item = {
      tenantId: tenantId.toString(),
      jobId: 'export-1',
      timestamp: new Date(),
      resourceId: adspId`${apiId}:/tests`.toString(),
      requestedBy: { id: 'tester', name: 'Tester' },
      params: {},
      filename: 'exported',
      fileType: 'export',
      format: 'json',
      formatOptions: {},
    };
    await job(item);

    expect(exported).toBe('[\n  {"id":"test-1","name":"Test 1"},\n  {"id":"test-2","name":"Test 2"}\n]\n');
    expect(fileServiceMock.upload).toHaveBeenCalledWith(
      expect.any(AdspId),
      item.fileType,
      item.resourceId,
      item.filename + '.json',
      expect.any(Readable)
    );
    expect(repositoryMock.update).toHaveBeenCalledWith('export-1', 'completed', result);
    expect(eventServiceMock.send).toHaveBeenCalledWith(
      expect.objectContaining({ name: ExportCompletedDefinition.name })
    );
  });

  it('can process export object results', async () => {
    const job = createExportJob({
      logger: loggerMock,
      directory: directoryMock,
      tokenProvider: tokenProviderMock,
      eventService: eventServiceMock,
      repository: repositoryMock,
      fileService: fileServiceMock,
    });

    directoryMock.getResourceUrl.mockResolvedValue(new URL('http://test-service/test/v1/tests'));
    axiosMock.get.mockResolvedValueOnce({
      data: { id: 'test-1', name: 'Test 1' },
    });

    const result = {
      id: 'exported-1',
      urn: 'urn:ads:platform:file-service:v1:/files/exported-1',
      filename: 'exported.csv',
    };
    const decoder = new TextDecoder();
    let exported = '';
    fileServiceMock.upload.mockImplementationOnce(
      async (_tenantId, _fileType, _recordId, _filename, content: Readable) => {
        return new Promise((resolve, reject) => {
          content.on('data', (chunk: unknown) => {
            exported += decoder.decode(chunk as Buffer);
          });
          content.on('error', (err) => reject(err));
          content.on('end', () => resolve(result));
          content.read();
        });
      }
    );

    const item = {
      tenantId: tenantId.toString(),
      jobId: 'export-1',
      timestamp: new Date(),
      resourceId: adspId`${apiId}:/tests`.toString(),
      requestedBy: { id: 'tester', name: 'Tester' },
      params: {},
      filename: 'exported',
      fileType: 'export',
      format: 'json',
      formatOptions: {},
    };
    await job(item);

    expect(exported).toBe('[\n  {"id":"test-1","name":"Test 1"}\n]\n');
    expect(fileServiceMock.upload).toHaveBeenCalledWith(
      expect.any(AdspId),
      item.fileType,
      item.resourceId,
      item.filename + '.json',
      expect.any(Readable)
    );
    expect(repositoryMock.update).toHaveBeenCalledWith('export-1', 'completed', result);
    expect(eventServiceMock.send).toHaveBeenCalledWith(
      expect.objectContaining({ name: ExportCompletedDefinition.name })
    );
  });
});
