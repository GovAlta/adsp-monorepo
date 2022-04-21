import { adspId } from '@abgov/adsp-service-sdk';
import { v4 as uuid } from 'uuid';
import { Logger } from 'winston';
import { PDF_GENERATED, PDF_GENERATION_FAILED } from '../events';
import { createGenerateJob } from './generate';
import { PdfServiceWorkItem } from './types';

describe('generate', () => {
  const serviceId = adspId`urn:ads:platform:pdf-service`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const tokenProviderMock = {
    getAccessToken: jest.fn(),
  };

  const configurationServiceMock = {
    getConfiguration: jest.fn(),
  };

  const eventServiceMock = {
    send: jest.fn(),
  };

  const fileServiceMock = {
    upload: jest.fn(),
  };

  const repositoryMock = {
    create: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
  };

  it('can create job', () => {
    const job = createGenerateJob({
      logger: loggerMock,
      serviceId,
      tokenProvider: tokenProviderMock,
      configurationService: configurationServiceMock,
      eventService: eventServiceMock,
      fileService: fileServiceMock,
      repository: repositoryMock,
    });

    expect(job).toBeTruthy();
  });

  describe('generateJob', () => {
    const job = createGenerateJob({
      logger: loggerMock,
      serviceId,
      tokenProvider: tokenProviderMock,
      configurationService: configurationServiceMock,
      eventService: eventServiceMock,
      fileService: fileServiceMock,
      repository: repositoryMock,
    });

    const templateEntity = {
      generate: jest.fn(),
    };

    beforeEach(() => {
      eventServiceMock.send.mockReset();
      tokenProviderMock.getAccessToken.mockReset();
      configurationServiceMock.getConfiguration.mockReset();
      templateEntity.generate.mockReset();
      fileServiceMock.upload.mockReset();
      repositoryMock.update.mockReset();
    });

    it('can generate pdf', (done) => {
      const item: PdfServiceWorkItem = {
        tenantId: `${tenantId}`,
        work: 'generate',
        jobId: uuid(),
        timestamp: new Date(),
        templateId: 'test-template',
        data: {},
        filename: 'test.pdf',
        generatedBy: {
          id: 'tester',
          name: 'Testy McTester',
        },
      };

      tokenProviderMock.getAccessToken.mockResolvedValueOnce('token');
      configurationServiceMock.getConfiguration.mockResolvedValueOnce([{ 'test-template': templateEntity }]);
      templateEntity.generate.mockResolvedValueOnce('content');
      const fileResult = {};
      fileServiceMock.upload.mockResolvedValueOnce(fileResult);

      job(item, true, (err) => {
        expect(err).toBeFalsy();
        expect(repositoryMock.update).toHaveBeenCalledWith(item.jobId, 'completed', fileResult);
        expect(eventServiceMock.send).toHaveBeenCalledWith(
          expect.objectContaining({ name: PDF_GENERATED, payload: expect.objectContaining({ file: fileResult }) })
        );
        done();
      });
    });

    it('can send failed event', (done) => {
      const item: PdfServiceWorkItem = {
        tenantId: `${tenantId}`,
        work: 'generate',
        jobId: uuid(),
        timestamp: new Date(),
        templateId: 'test-template',
        data: {},
        filename: 'test.pdf',
        generatedBy: {
          id: 'tester',
          name: 'Testy McTester',
        },
      };

      tokenProviderMock.getAccessToken.mockResolvedValueOnce('token');
      configurationServiceMock.getConfiguration.mockResolvedValueOnce([{ 'test-template': templateEntity }]);
      templateEntity.generate.mockResolvedValueOnce('content');
      fileServiceMock.upload.mockRejectedValueOnce(new Error('oh noes!'));

      job(item, false, (err) => {
        expect(err).toBeTruthy();
        expect(repositoryMock.update).toHaveBeenCalledWith(item.jobId, 'failed');
        expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: PDF_GENERATION_FAILED }));
        done();
      });
    });

    it('can skip send failed event if retrying', (done) => {
      const item: PdfServiceWorkItem = {
        tenantId: `${tenantId}`,
        work: 'generate',
        jobId: uuid(),
        timestamp: new Date(),
        templateId: 'test-template',
        data: {},
        filename: 'test.pdf',
        generatedBy: {
          id: 'tester',
          name: 'Testy McTester',
        },
      };

      tokenProviderMock.getAccessToken.mockResolvedValueOnce('token');
      configurationServiceMock.getConfiguration.mockResolvedValueOnce([{ 'test-template': templateEntity }]);
      templateEntity.generate.mockResolvedValueOnce('content');
      fileServiceMock.upload.mockRejectedValueOnce(new Error('oh noes!'));

      job(item, true, (err) => {
        expect(err).toBeTruthy();
        expect(repositoryMock.update).not.toHaveBeenCalled();
        expect(eventServiceMock.send).not.toHaveBeenCalled();
        done();
      });
    });
  });
});
