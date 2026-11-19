import { adspId } from '@abgov/adsp-service-sdk';
import axios, { AxiosError } from 'axios';
import { Logger } from 'winston';
import { FormDefinitionEntity, FormEntity, FormStatus, FormSubmission, FormSubmissionEntity } from './form';
import { createSharePointService } from './sharepoint';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('sharepoint', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;
  const tokenProvider = { getAccessToken: jest.fn() };
  const directory = { getServiceUrl: jest.fn(), getResourceUrl: jest.fn() };
  const validationService = { validate: jest.fn(), setSchema: jest.fn() };
  const calendarService = { getScheduledIntake: jest.fn(), updateScheduleIntake: jest.fn() };
  const repository = {
    find: jest.fn(),
    get: jest.fn(),
    save: jest.fn((entity) => Promise.resolve(entity)),
    delete: jest.fn(),
  };
  const submissionRepository = { find: jest.fn(), get: jest.fn(), save: jest.fn(), delete: jest.fn() };

  const definition = new FormDefinitionEntity(validationService, calendarService, tenantId, {
    id: 'test',
    name: 'test-form-definition',
    description: null,
    anonymousApply: false,
    applicantRoles: [],
    assessorRoles: [],
    clerkRoles: [],
    dataSchema: {},
    sharepointConfigurationId: 'hr intake',
  });

  const submitted = new Date('2026-11-16T12:00:00.000Z');
  const fileUrn = (id: string) => adspId`urn:ads:platform:file-service:v1:/files/${id}`;

  const aForm = (props: Partial<FormEntity> = {}) =>
    new FormEntity(repository, tenantId, definition, null, {
      id: 'form-1',
      formDraftUrl: 'https://my-form/form-1',
      anonymousApplicant: false,
      created: new Date(),
      createdBy: { id: 'tester', name: 'tester' },
      locked: null,
      submitted,
      lastAccessed: new Date(),
      status: FormStatus.Submitted,
      data: { applicant: { name: 'Ada' } },
      files: {},
      dryRun: false,
      ...props,
    });

  const aSubmission = (props: Partial<FormSubmission> = {}) =>
    new FormSubmissionEntity(submissionRepository, tenantId, {
      id: 'submission-1',
      formDefinitionId: 'test',
      formDefinitionRevision: 0,
      formId: 'form-1',
      formData: { applicant: { name: 'Grace' } },
      formFiles: {},
      created: new Date(),
      createdBy: { id: 'tester', name: 'tester' },
      updatedBy: { id: 'tester', name: 'tester' },
      updated: new Date(),
      submissionStatus: '',
      disposition: null,
      hash: 'hash',
      dryRun: false,
      ...props,
    });

  const axiosError = (response?: { status: number; data?: unknown }) =>
    ({ isAxiosError: true, response }) as unknown as AxiosError;

  const service = createSharePointService(logger, directory, tokenProvider);

  beforeEach(() => {
    jest.clearAllMocks();
    axiosMock.isAxiosError.mockImplementation((err): err is AxiosError => !!(err as AxiosError)?.isAxiosError);
    directory.getServiceUrl.mockResolvedValue(new URL('http://sharepoint-service'));
    tokenProvider.getAccessToken.mockResolvedValue('token');
    axiosMock.post.mockResolvedValue({ data: {} });
  });

  it('sends files and data in one call, with the submission as the folder and row key', async () => {
    const result = await service.push(
      aForm(),
      aSubmission({ formFiles: { proof: fileUrn('f1'), 'applicant.statement': fileUrn('f2') } }),
    );

    expect(result).toEqual({ success: true });
    expect(axiosMock.post).toHaveBeenCalledTimes(1);
    expect(axiosMock.post).toHaveBeenCalledWith(
      'http://sharepoint-service/sharepoint/v1/destinations/hr%20intake/files',
      {
        submissionId: 'submission-1',
        files: [
          { field: 'proof', fileId: 'urn:ads:platform:file-service:v1:/files/f1' },
          { field: 'applicant.statement', fileId: 'urn:ads:platform:file-service:v1:/files/f2' },
        ],
        data: {
          applicant: { name: 'Grace' },
          _adsp: { key: 'submission-1', formId: 'form-1', submittedAt: '2026-11-16T12:00:00.000Z' },
        },
      },
      expect.objectContaining({
        headers: { Authorization: 'Bearer token' },
        params: { tenantId: tenantId.toString() },
      }),
    );
  });

  it('sends only the data when the form has no files', async () => {
    await service.push(aForm(), aSubmission());

    expect(axiosMock.post).toHaveBeenCalledWith(
      'http://sharepoint-service/sharepoint/v1/destinations/hr%20intake/data',
      {
        applicant: { name: 'Grace' },
        _adsp: { key: 'submission-1', formId: 'form-1', submittedAt: '2026-11-16T12:00:00.000Z' },
      },
      expect.anything(),
    );
  });

  it('uses the form ID as the key and the form data when there is no submission record', async () => {
    await service.push(aForm({ files: { proof: fileUrn('f1') } }));

    expect(axiosMock.post).toHaveBeenCalledWith(
      expect.stringMatching(/\/files$/),
      expect.objectContaining({
        submissionId: 'form-1',
        files: [{ field: 'proof', fileId: 'urn:ads:platform:file-service:v1:/files/f1' }],
        data: expect.objectContaining({
          applicant: { name: 'Ada' },
          _adsp: expect.objectContaining({ key: 'form-1' }),
        }),
      }),
      expect.anything(),
    );
  });

  it('does not change the form data it was given', async () => {
    const form = aForm();

    await service.push(form);

    expect(form.data).toEqual({ applicant: { name: 'Ada' } });
  });

  describe('failures', () => {
    it('reports the first failed file, retryable only when every failure is retryable', async () => {
      axiosMock.post.mockRejectedValueOnce(
        axiosError({
          status: 502,
          data: {
            files: [
              { status: 'uploaded' },
              { status: 'failed', errorCode: 'graph:TooManyRequests', retryable: true },
              { status: 'failed', errorCode: 'file:not-found', retryable: false },
            ],
          },
        }),
      );

      expect(await service.push(aForm({ files: { proof: fileUrn('f1') } }))).toEqual({
        success: false,
        errorCode: 'graph:TooManyRequests',
        retryable: false,
      });
    });

    it('reports a row failure', async () => {
      axiosMock.post.mockRejectedValueOnce(
        axiosError({
          status: 502,
          data: {
            files: [{ status: 'uploaded' }],
            row: { written: false, errorCode: 'graph:invalidRequest', retryable: false },
          },
        }),
      );

      expect(await service.push(aForm({ files: { proof: fileUrn('f1') } }))).toEqual({
        success: false,
        errorCode: 'graph:invalidRequest',
        retryable: false,
      });
    });

    it('reports an error from the data endpoint', async () => {
      axiosMock.post.mockRejectedValueOnce(
        axiosError({ status: 502, data: { errorCode: 'graph:TooManyRequests', retryable: true } }),
      );

      expect(await service.push(aForm())).toEqual({
        success: false,
        errorCode: 'graph:TooManyRequests',
        retryable: true,
      });
    });

    it('reports the HTTP status, not retryable, for other responses', async () => {
      axiosMock.post.mockRejectedValueOnce(axiosError({ status: 409, data: { errorMessage: 'secret detail' } }));

      const result = await service.push(aForm());

      expect(result).toEqual({ success: false, errorCode: 'http:409', retryable: false });
      expect(JSON.stringify(result)).not.toContain('secret detail');
    });

    it.each([502, 503, 504])(
      'reports a %i from the gateway, with no error from the service, as retryable',
      async (status) => {
        axiosMock.post.mockRejectedValueOnce(axiosError({ status, data: '<html>gateway</html>' }));

        expect(await service.push(aForm())).toEqual({ success: false, errorCode: `http:${status}`, retryable: true });
      },
    );

    it('reports a network error as retryable', async () => {
      axiosMock.post.mockRejectedValueOnce(axiosError());

      expect(await service.push(aForm())).toEqual({ success: false, errorCode: 'network', retryable: true });
    });

    it('reports an unexpected error as unknown and does not throw', async () => {
      directory.getServiceUrl.mockRejectedValueOnce(new Error('directory down'));

      expect(await service.push(aForm())).toEqual({ success: false, errorCode: 'unknown', retryable: false });
    });

    it('does not log the form data', async () => {
      await service.push(aForm({ data: { secret: 'my-sin-123' } }));

      expect(JSON.stringify((logger.debug as jest.Mock).mock.calls)).not.toContain('my-sin-123');
    });
  });
});
