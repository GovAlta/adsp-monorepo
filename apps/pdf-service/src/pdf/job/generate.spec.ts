import { adspId } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
import { v4 as uuid } from 'uuid';
import { Logger } from 'winston';
import { PdfJobGeneratedAuditAction } from '../audit';
import { PDF_GENERATED, PDF_GENERATION_FAILED } from '../events';
import { GENERATED_PDF } from '../fileTypes';
import { createGenerateJob } from './generate';
import { PdfServiceWorkItem } from './types';
import axios from 'axios';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

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
    getServiceConfiguration: jest.fn(),
    getServiceConfigurationRevision: jest.fn(),
  };

  const eventServiceMock = {
    send: jest.fn(),
  };

  const fileServiceMock = {
    typeExists: jest.fn(),
    upload: jest.fn(),
  };

  const repositoryMock = {
    create: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
  };

  const auditServiceMock = {
    record: jest.fn(),
    query: jest.fn(),
    flush: jest.fn(),
    droppedEventCount: 0,
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
      auditService: auditServiceMock,
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
      auditService: auditServiceMock,
    });

    const templateEntity = {
      generate: jest.fn(),
      evaluateTemplates: jest.fn(),
    };

    beforeEach(() => {
      eventServiceMock.send.mockReset();
      tokenProviderMock.getAccessToken.mockReset();
      configurationServiceMock.getConfiguration.mockReset();
      templateEntity.generate.mockReset();
      templateEntity.evaluateTemplates.mockReset();

      fileServiceMock.upload.mockReset();
      repositoryMock.update.mockReset();
      auditServiceMock.record.mockReset();
    });

    it('can generate pdf', (done) => {
      const item: PdfServiceWorkItem = {
        tenantId: `${tenantId}`,
        work: 'generate',
        jobId: uuid(),
        timestamp: new Date(),
        templateId: 'test-template',
        fileType: GENERATED_PDF,
        recordId: 'my-domain-record-1',
        data: {},
        context: {},
        filename: 'test.pdf',
        requestedBy: {
          id: 'tester',
          name: 'Testy McTester',
        },
      };

      tokenProviderMock.getAccessToken.mockResolvedValueOnce('token');
      configurationServiceMock.getConfiguration.mockResolvedValueOnce([{ 'test-template': templateEntity }]);
      templateEntity.generate.mockResolvedValueOnce('content');
      templateEntity.evaluateTemplates.mockResolvedValueOnce('');
      const fileResult = {};
      fileServiceMock.upload.mockResolvedValueOnce(fileResult);

      job(item, true, (err) => {
        expect(err).toBeFalsy();
        expect(repositoryMock.update).toHaveBeenCalledWith(item.jobId, 'completed', fileResult);
        expect(eventServiceMock.send).toHaveBeenCalledWith(
          expect.objectContaining({ name: PDF_GENERATED, payload: expect.objectContaining({ file: fileResult }) }),
        );
        done();
      });
    });

    it('can generate core pdf', (done) => {
      const item: PdfServiceWorkItem = {
        tenantId: `${tenantId}`,
        work: 'generate',
        jobId: uuid(),
        timestamp: new Date(),
        templateId: 'submitted-form',
        fileType: GENERATED_PDF,
        recordId: 'my-domain-record-1',
        data: {
          formId: 'my-form-id',
          formData: { data: { firstName: 'bob', lastName: 'smith' } },
          form: {
            id: '262f0da7-f375-493a-bd96-c6035ca16bf7',
          },
        },
        context: {},
        filename: 'test.pdf',
        requestedBy: {
          id: 'tester',
          name: 'Testy McTester',
        },
      };

      const myFormIdConfig = {
        id: 'my-form-id',
        name: 'my-form-id',
      };

      tokenProviderMock.getAccessToken.mockResolvedValueOnce('token');
      configurationServiceMock.getConfiguration.mockResolvedValueOnce([{ 'submitted-form': templateEntity }]);
      templateEntity.generate.mockResolvedValueOnce('content');
      templateEntity.evaluateTemplates.mockResolvedValueOnce('');
      const fileResult = {};
      fileServiceMock.upload.mockResolvedValueOnce(fileResult);
      axiosMock.get.mockResolvedValueOnce({ data: { 'my-form-id': myFormIdConfig } });

      job(item, true, (err) => {
        expect(err).toBeFalsy();
        expect(repositoryMock.update).toHaveBeenCalledWith(item.jobId, 'completed', fileResult);
        expect(eventServiceMock.send).toHaveBeenCalledWith(
          expect.objectContaining({ name: PDF_GENERATED, payload: expect.objectContaining({ file: fileResult }) }),
        );
        done();
      });
    });

    it('can generate with form', (done) => {
      const item: PdfServiceWorkItem = {
        tenantId: `${tenantId}`,
        work: 'generate',
        jobId: uuid(),
        timestamp: new Date(),
        templateId: 'submitted-form',
        fileType: GENERATED_PDF,
        recordId: 'my-domain-record-1',
        data: {
          content: {
            config: {
              id: 'postal-address-alberta-2',
              name: 'postal-address-alberta-2',
              description: '',
              applicantRoles: ['urn:ads:platform:form-service:form-applicant'],
              clerkRoles: [],
              assessorRoles: [],
              formDraftUrlTemplate: 'http://localhost:4202/autotest/postal-address-alberta-2',
              anonymousApply: false,
              dispositionStates: [],
              submissionRecords: false,
              submissionPdfTemplate: 'submitted-form',
              queueTaskToProcess: {
                queueName: '',
                queueNameSpace: '',
              },
              supportTopic: false,
              securityClassification: 'protected b',
              dataSchema: {
                type: 'object',
                properties: {
                  mailingAddress: {
                    $ref: 'https://adsp.alberta.ca/common.v1.schema.json#/definitions/postalAddressCanada',
                  },
                },
              },
              uiSchema: {
                type: 'VerticalLayout',
                elements: [
                  {
                    type: 'Group',
                    label: 'Mailing address',
                    elements: [
                      {
                        type: 'Control',
                        scope: '#/properties/mailingAddress',
                      },
                    ],
                  },
                ],
              },
            },
            data: {
              mailingAddress: {
                addressLine1: '10411 65 Ave NW',
                addressLine2: '',
                municipality: 'Edmonton',
                subdivisionCode: 'AB',
                postalCode: 'T6H 1V2',
                country: 'CA',
              },
            },
          },
        },
        context: {},
        filename: 'test.pdf',
        requestedBy: {
          id: 'tester',
          name: 'Testy McTester',
        },
      };

      const myFormIdConfig = {
        id: 'my-form-id',
        name: 'my-form-id',
      };

      tokenProviderMock.getAccessToken.mockResolvedValueOnce('token');
      configurationServiceMock.getConfiguration.mockResolvedValueOnce([{ 'submitted-form': templateEntity }]);
      templateEntity.generate.mockResolvedValueOnce('content');
      templateEntity.evaluateTemplates.mockResolvedValueOnce('');
      const fileResult = {};
      fileServiceMock.upload.mockResolvedValueOnce(fileResult);
      axiosMock.get.mockResolvedValueOnce({ data: { 'my-form-id': myFormIdConfig } });

      job(item, true, (err) => {
        expect(err).toBeFalsy();
        expect(repositoryMock.update).toHaveBeenCalledWith(item.jobId, 'completed', fileResult);
        expect(eventServiceMock.send).toHaveBeenCalledWith(
          expect.objectContaining({ name: PDF_GENERATED, payload: expect.objectContaining({ file: fileResult }) }),
        );
        done();
      });
    });

    it('can handle missing template', async () => {
      const item: PdfServiceWorkItem = {
        tenantId: `${tenantId}`,
        work: 'generate',
        jobId: uuid(),
        timestamp: new Date(),
        templateId: 'test-template',
        fileType: GENERATED_PDF,
        recordId: 'my-domain-record-1',
        data: {},
        context: {},
        filename: 'test.pdf',
        requestedBy: {
          id: 'tester',
          name: 'Testy McTester',
        },
      };

      tokenProviderMock.getAccessToken.mockResolvedValueOnce('token');
      configurationServiceMock.getConfiguration.mockResolvedValueOnce([{}]);

      const done = jest.fn();
      await job(item, true, done);
      expect(done).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('can send failed event', (done) => {
      const item: PdfServiceWorkItem = {
        tenantId: `${tenantId}`,
        work: 'generate',
        jobId: uuid(),
        timestamp: new Date(),
        templateId: 'test-template',
        fileType: GENERATED_PDF,
        recordId: 'my-domain-record-1',
        data: {},
        context: {},
        filename: 'test.pdf',
        requestedBy: {
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
        expect(eventServiceMock.send).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({
              error: 'Error: oh noes!',
            }),
          }),
        );

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
        fileType: GENERATED_PDF,
        recordId: 'my-domain-record-1',
        data: {},
        context: {},
        filename: 'test.pdf',
        requestedBy: {
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

    describe('audit', () => {
      const item: PdfServiceWorkItem = {
        tenantId: `${tenantId}`,
        work: 'generate',
        jobId: 'job-1',
        timestamp: new Date(),
        templateId: 'test-template',
        fileType: GENERATED_PDF,
        recordId: 'my-domain-record-1',
        data: {},
        context: {},
        filename: 'test.pdf',
        requestedBy: { id: 'svc', name: 'service-account-urn:ads:platform:form-service' },
      };
      const expectedDetails = {
        // The job parses the tenant ID, so it is a different AdspId instance.
        tenantId: expect.objectContaining({ resource: '/tenants/test' }),
        actor: { id: 'svc', type: 'service', name: 'service-account-urn:ads:platform:form-service' },
        resource: { type: 'pdf-job', id: 'job-1', name: 'test.pdf' },
        correlationId: 'my-domain-record-1',
      };
      const expectedMetadata = {
        templateId: 'test-template',
        filename: 'test.pdf',
        fileType: GENERATED_PDF,
        recordId: 'my-domain-record-1',
      };

      beforeEach(() => {
        tokenProviderMock.getAccessToken.mockResolvedValueOnce('token');
        configurationServiceMock.getConfiguration.mockResolvedValueOnce([{ 'test-template': templateEntity }]);
        templateEntity.generate.mockResolvedValueOnce('content');
      });

      it('records pdf.job.generated with the resulting file ID', async () => {
        fileServiceMock.upload.mockResolvedValueOnce({ id: 'file-1', urn: 'urn:file-1', filename: 'test.pdf' });

        const done = jest.fn();
        await job(item, true, done);

        expect(done).toHaveBeenCalledWith();
        expect(auditServiceMock.record).toHaveBeenCalledTimes(1);
        expect(auditServiceMock.record).toHaveBeenCalledWith(PdfJobGeneratedAuditAction, {
          ...expectedDetails,
          metadata: { ...expectedMetadata, fileId: 'file-1' },
        });
      });

      it('records a failed pdf.job.generated when the job fails', async () => {
        fileServiceMock.upload.mockRejectedValueOnce(new Error('oh noes!'));

        const done = jest.fn();
        await job(item, false, done);

        expect(done).toHaveBeenCalledWith(expect.any(Error));
        expect(auditServiceMock.record).toHaveBeenCalledTimes(1);
        expect(auditServiceMock.record).toHaveBeenCalledWith(PdfJobGeneratedAuditAction, {
          ...expectedDetails,
          status: 'failure',
          metadata: { ...expectedMetadata, error: 'Error: oh noes!' },
        });
      });

      it('does not record an attempt that will be retried', async () => {
        fileServiceMock.upload.mockRejectedValueOnce(new Error('oh noes!'));

        await job(item, true, jest.fn());

        expect(auditServiceMock.record).not.toHaveBeenCalled();
      });
    });
  });
});
