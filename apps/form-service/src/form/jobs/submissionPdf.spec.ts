import { adspId } from '@abgov/adsp-service-sdk';
import { DomainEvent } from '@core-services/core-common';
import { Logger } from 'winston';
import { SHAREPOINT_PUSH_FAILED } from '../events';
import { createSubmissionPdfJob } from './submissionPdf';

describe('createSubmissionPdfJob', () => {
  const apiId = adspId`urn:ads:platform:form-service:v1`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const timestamp = new Date('2026-11-20T12:00:00Z');
  const pdfUrn = 'urn:ads:platform:file-service:v1:/files/pdf-1';

  const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;
  const repository = { get: jest.fn(), find: jest.fn(), save: jest.fn(), delete: jest.fn() };
  const submissionRepository = { get: jest.fn(), find: jest.fn(), save: jest.fn(), delete: jest.fn() };
  const sharepointService = { push: jest.fn() };
  const eventService = { send: jest.fn() };

  const aForm = (definition: Record<string, unknown> = {}, props: Record<string, unknown> = {}) => ({
    id: 'form-1',
    tenantId,
    dryRun: false,
    definition: {
      submissionPdfTemplate: 'submitted-form',
      sharepointConfigurationId: 'hr-intake',
      submissionRecords: true,
      ...definition,
    },
    ...props,
  });
  const aSubmission = () => ({ id: 'submission-1' });

  const anEvent = (name = 'pdf-generated', context: Record<string, unknown> = {}): DomainEvent =>
    ({
      namespace: 'pdf-service',
      name,
      tenantId,
      timestamp,
      correlationId: 'job-1',
      context: {
        trigger: 'form-service:form-submitted',
        formDefinitionId: 'test',
        formId: 'form-1',
        submissionId: 'submission-1',
        jobId: 'job-1',
        templateId: 'submitted-form',
        ...context,
      },
      payload: { jobId: 'job-1', templateId: 'submitted-form', file: { id: 'pdf-1', urn: pdfUrn, filename: 'a.pdf' } },
    }) as unknown as DomainEvent;

  const job = createSubmissionPdfJob({
    apiId,
    logger,
    repository,
    submissionRepository,
    sharepointService,
    eventService,
  });

  beforeEach(() => {
    jest.resetAllMocks();
    repository.get.mockResolvedValue(aForm());
    submissionRepository.get.mockResolvedValue(aSubmission());
    sharepointService.push.mockResolvedValue({ success: true });
  });

  describe('when the PDF is generated', () => {
    it('pushes the PDF with the submission it was generated for', async () => {
      await job(anEvent());

      expect(repository.get).toHaveBeenCalledWith(tenantId, 'form-1');
      expect(submissionRepository.get).toHaveBeenCalledWith(tenantId, 'submission-1', 'form-1');
      expect(sharepointService.push).toHaveBeenCalledWith(aForm(), aSubmission(), pdfUrn);
      expect(eventService.send).not.toHaveBeenCalled();
    });

    it('pushes with the form alone when the definition keeps no submission records', async () => {
      repository.get.mockResolvedValue(aForm({ submissionRecords: false }));

      await job(anEvent('pdf-generated', { submissionId: undefined }));

      expect(submissionRepository.get).not.toHaveBeenCalled();
      expect(sharepointService.push).toHaveBeenCalledWith(aForm({ submissionRecords: false }), undefined, pdfUrn);
    });

    it('does not push when the form has no SharePoint destination', async () => {
      repository.get.mockResolvedValue(aForm({ sharepointConfigurationId: undefined }));

      await job(anEvent());

      expect(sharepointService.push).not.toHaveBeenCalled();
    });

    it("does not push a PDF made from a template other than the form's submission template", async () => {
      await job(anEvent('pdf-generated', { templateId: 'another-template' }));

      expect(sharepointService.push).not.toHaveBeenCalled();
    });

    it('does not push when it cannot tell which submission the PDF belongs to', async () => {
      await job(anEvent('pdf-generated', { submissionId: undefined }));

      expect(sharepointService.push).not.toHaveBeenCalled();
    });

    it('does not push when the submission no longer exists', async () => {
      submissionRepository.get.mockResolvedValue(null);

      await job(anEvent());

      expect(sharepointService.push).not.toHaveBeenCalled();
    });

    it('does not push a dry run', async () => {
      repository.get.mockResolvedValue(aForm({}, { dryRun: true }));

      await job(anEvent());

      expect(sharepointService.push).not.toHaveBeenCalled();
    });

    it('does not throw when the push fails', async () => {
      sharepointService.push.mockRejectedValue(new Error('boom'));

      await expect(job(anEvent())).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('when the PDF could not be generated', () => {
    it('sends one push-failed event for the submission PDF and pushes nothing', async () => {
      await job(anEvent('pdf-generation-failed'));

      expect(sharepointService.push).not.toHaveBeenCalled();
      expect(eventService.send).toHaveBeenCalledTimes(1);
      expect(eventService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: SHAREPOINT_PUSH_FAILED,
          tenantId,
          payload: {
            formId: 'form-1',
            submissionId: 'submission-1',
            destinationId: 'hr-intake',
            part: 'submission-pdf',
            errorCode: 'pdf-generation-failed',
          },
        }),
      );
    });

    it('sends nothing when the form has no SharePoint destination', async () => {
      repository.get.mockResolvedValue(aForm({ sharepointConfigurationId: undefined }));

      await job(anEvent('pdf-generation-failed'));

      expect(eventService.send).not.toHaveBeenCalled();
    });
  });

  describe('other events', () => {
    it.each([
      ['another namespace', { ...anEvent(), namespace: 'file-service' }],
      ['a queued PDF', anEvent('pdf-generation-queued')],
      ['a PDF not requested on submit', anEvent('pdf-generated', { trigger: 'another-service:something' })],
      ['a PDF without a form', anEvent('pdf-generated', { formId: undefined })],
    ])('ignores %s without reading the form', async (_, event) => {
      await job(event as DomainEvent);

      expect(repository.get).not.toHaveBeenCalled();
      expect(sharepointService.push).not.toHaveBeenCalled();
      expect(eventService.send).not.toHaveBeenCalled();
    });
  });
});
