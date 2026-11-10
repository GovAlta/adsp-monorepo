import { adspId } from '@abgov/adsp-service-sdk';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import {
  PdfJobCreatedAuditAction,
  PdfTemplateCreatedAuditAction,
  PdfTemplateDeletedAuditAction,
  PdfTemplateUpdatedAuditAction,
} from '../audit';
import { GENERATED_PDF } from '../fileTypes';
import { ServiceRoles } from '../roles';
import { createPdfTemplate, deletePdfTemplate, generatePdf, updatePdfTemplate } from './pdf';
import axios from 'axios';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('pdf router audit', () => {
  const serviceId = adspId`urn:ads:platform:pdf-service`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const admin = { tenantId, id: 'admin', name: 'Admin', email: 'admin@test.co', roles: [ServiceRoles.Admin] };

  const loggerMock = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;
  const repositoryMock = { create: jest.fn(), get: jest.fn(), update: jest.fn() };
  const eventServiceMock = { send: jest.fn() };
  const fileServiceMock = { typeExists: jest.fn(), upload: jest.fn() };
  const queueServiceMock = { enqueue: jest.fn(), getItems: jest.fn(), isConnected: jest.fn() };
  const tokenProviderMock = { getAccessToken: jest.fn() };
  const directoryMock = {
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('http://localhost:80'))),
    getResourceUrl: jest.fn(() => Promise.resolve(new URL('http://localhost:80'))),
  };
  const auditServiceMock = { record: jest.fn(), query: jest.fn(), flush: jest.fn(), droppedEventCount: 0 };

  const existingTemplate = {
    id: 'letter',
    name: 'Letter',
    description: 'Decision letter.',
    template: '<p>Old</p>',
  };

  const createResponse = () => {
    const res = { status: jest.fn(), send: jest.fn(), json: jest.fn() };
    res.status.mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    tokenProviderMock.getAccessToken.mockResolvedValue('token');
    axiosMock.patch.mockResolvedValue({ data: {} });
  });

  describe('createPdfTemplate', () => {
    it('records pdf.template.created', async () => {
      const req = {
        tenant: { id: tenantId },
        user: admin,
        body: { name: 'New Letter', description: 'desc' },
        getConfiguration: jest.fn().mockResolvedValue([{}]),
      };
      const next = jest.fn();

      await createPdfTemplate(directoryMock, tokenProviderMock, auditServiceMock)(
        req as unknown as Request,
        createResponse() as unknown as Response,
        next,
      );

      expect(next).not.toHaveBeenCalled();
      expect(auditServiceMock.record).toHaveBeenCalledTimes(1);
      expect(auditServiceMock.record).toHaveBeenCalledWith(PdfTemplateCreatedAuditAction, {
        tenantId,
        actor: expect.objectContaining({ id: 'admin', type: 'user', name: 'Admin' }),
        resource: { type: 'pdf-template', id: 'new-letter', name: 'New Letter' },
        metadata: { templateId: 'new-letter', name: 'New Letter' },
      });
    });

    it('does not record when the template already exists', async () => {
      const req = {
        tenant: { id: tenantId },
        user: admin,
        body: { name: 'Letter' },
        getConfiguration: jest.fn().mockResolvedValue([{ letter: existingTemplate }]),
      };

      await createPdfTemplate(directoryMock, tokenProviderMock, auditServiceMock)(
        req as unknown as Request,
        createResponse() as unknown as Response,
        jest.fn(),
      );

      expect(auditServiceMock.record).not.toHaveBeenCalled();
    });

    it('does not record when the configuration update fails', async () => {
      axiosMock.patch.mockRejectedValueOnce(new Error('failed'));
      const req = {
        tenant: { id: tenantId },
        user: admin,
        body: { name: 'New Letter' },
        getConfiguration: jest.fn().mockResolvedValue([{}]),
      };
      const next = jest.fn();

      await createPdfTemplate(directoryMock, tokenProviderMock, auditServiceMock)(
        req as unknown as Request,
        createResponse() as unknown as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(auditServiceMock.record).not.toHaveBeenCalled();
    });
  });

  describe('updatePdfTemplate', () => {
    it('records pdf.template.updated with the changed fields', async () => {
      const req = {
        tenant: { id: tenantId },
        user: admin,
        params: { templateId: 'letter' },
        body: { template: '<p>New</p>', description: 'Decision letter.', footer: '<p>Footer</p>' },
        template: existingTemplate,
      };
      const next = jest.fn();

      await updatePdfTemplate(directoryMock, tokenProviderMock, auditServiceMock)(
        req as unknown as Request,
        createResponse() as unknown as Response,
        next,
      );

      expect(next).not.toHaveBeenCalled();
      expect(auditServiceMock.record).toHaveBeenCalledWith(PdfTemplateUpdatedAuditAction, {
        tenantId,
        actor: expect.objectContaining({ id: 'admin', type: 'user' }),
        resource: { type: 'pdf-template', id: 'letter', name: 'Letter' },
        metadata: { templateId: 'letter', name: 'Letter', changedFields: ['template', 'footer'] },
      });
    });

    it('does not record for an unauthorized user', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { ...admin, roles: [] },
        params: { templateId: 'letter' },
        body: { template: '<p>New</p>' },
        template: existingTemplate,
      };

      await updatePdfTemplate(directoryMock, tokenProviderMock, auditServiceMock)(
        req as unknown as Request,
        createResponse() as unknown as Response,
        jest.fn(),
      );

      expect(auditServiceMock.record).not.toHaveBeenCalled();
    });
  });

  describe('deletePdfTemplate', () => {
    it('records pdf.template.deleted', async () => {
      const req = {
        tenant: { id: tenantId },
        user: admin,
        params: { templateId: 'letter' },
        template: existingTemplate,
      };
      const next = jest.fn();

      await deletePdfTemplate(directoryMock, tokenProviderMock, auditServiceMock)(
        req as unknown as Request,
        createResponse() as unknown as Response,
        next,
      );

      expect(next).not.toHaveBeenCalled();
      expect(auditServiceMock.record).toHaveBeenCalledWith(PdfTemplateDeletedAuditAction, {
        tenantId,
        actor: expect.objectContaining({ id: 'admin', type: 'user' }),
        resource: { type: 'pdf-template', id: 'letter', name: 'Letter' },
        metadata: { templateId: 'letter', name: 'Letter' },
      });
    });

    it('does not record when the configuration delete fails', async () => {
      axiosMock.patch.mockRejectedValueOnce(new Error('failed'));
      const req = {
        tenant: { id: tenantId },
        user: admin,
        params: { templateId: 'letter' },
        template: existingTemplate,
      };

      await deletePdfTemplate(directoryMock, tokenProviderMock, auditServiceMock)(
        req as unknown as Request,
        createResponse() as unknown as Response,
        jest.fn(),
      );

      expect(auditServiceMock.record).not.toHaveBeenCalled();
    });
  });

  describe('generatePdf', () => {
    const handler = () =>
      generatePdf(
        serviceId,
        repositoryMock,
        eventServiceMock,
        fileServiceMock,
        queueServiceMock,
        loggerMock,
        auditServiceMock,
      );

    it('records pdf.job.created for a service account', async () => {
      const req = {
        tenant: { id: tenantId },
        user: {
          tenantId,
          id: 'svc',
          name: 'service-account-urn:ads:platform:form-service',
          roles: [ServiceRoles.PdfGenerator],
        },
        body: { templateId: 'letter', filename: 'letter.pdf', recordId: 'record-1', data: {} },
        template: existingTemplate,
      };
      const next = jest.fn();
      repositoryMock.create.mockResolvedValueOnce({ id: 'job-1' });

      await handler()(req as unknown as Request, { send: jest.fn() } as unknown as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(auditServiceMock.record).toHaveBeenCalledTimes(1);
      expect(auditServiceMock.record).toHaveBeenCalledWith(PdfJobCreatedAuditAction, {
        tenantId,
        actor: expect.objectContaining({ id: 'svc', type: 'service' }),
        resource: { type: 'pdf-job', id: 'job-1', name: 'letter.pdf' },
        correlationId: 'record-1',
        metadata: { templateId: 'letter', filename: 'letter.pdf', fileType: GENERATED_PDF, recordId: 'record-1' },
      });
    });

    it('records the requested file type and defaults the record ID to the job ID', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.PdfGenerator] },
        body: { templateId: 'letter', filename: 'letter.pdf', fileType: 'letters' },
        template: existingTemplate,
      };
      repositoryMock.create.mockResolvedValueOnce({ id: 'job-1' });
      fileServiceMock.typeExists.mockResolvedValueOnce(true);

      await handler()(req as unknown as Request, { send: jest.fn() } as unknown as Response, jest.fn());

      expect(auditServiceMock.record).toHaveBeenCalledWith(
        PdfJobCreatedAuditAction,
        expect.objectContaining({
          correlationId: 'job-1',
          metadata: expect.objectContaining({ fileType: 'letters', recordId: 'job-1' }),
        }),
      );
    });

    it('does not record when the job cannot be queued', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.PdfGenerator] },
        body: { templateId: 'letter', filename: 'letter.pdf' },
        template: existingTemplate,
      };
      const next = jest.fn();
      repositoryMock.create.mockResolvedValueOnce({ id: 'job-1' });
      queueServiceMock.enqueue.mockRejectedValueOnce(new Error('queue down'));

      await handler()(req as unknown as Request, { send: jest.fn() } as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(auditServiceMock.record).not.toHaveBeenCalled();
    });

    it('does not record for an unauthorized user', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [] },
        body: { templateId: 'letter', filename: 'letter.pdf' },
        template: existingTemplate,
      };

      await handler()(req as unknown as Request, { send: jest.fn() } as unknown as Response, jest.fn());

      expect(auditServiceMock.record).not.toHaveBeenCalled();
    });
  });
});
