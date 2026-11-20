import { adspId } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { SHAREPOINT_PUSH_FAILED } from './events';
import { FormEntity, FormSubmissionEntity } from './model';
import { SharePointPush, SharePointPushResult } from './sharepoint';
import { parseRetryDelays, SharePointPushRetryService } from './sharepointRetry';

describe('SharePointPushRetryService', () => {
  const apiId = adspId`urn:ads:platform:form-service:v1`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const now = new Date('2026-11-19T12:00:00Z');
  const delays = [60, 300];

  const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;
  const client = { push: jest.fn() };
  const repository = { create: jest.fn(), claimDue: jest.fn(), reschedule: jest.fn(), delete: jest.fn() };
  const formRepository = { get: jest.fn(), find: jest.fn(), save: jest.fn(), delete: jest.fn() };
  const submissionRepository = { get: jest.fn(), find: jest.fn(), save: jest.fn(), delete: jest.fn() };
  const eventService = { send: jest.fn() };

  const aForm = (destination: string | null = 'hr-intake') =>
    ({ id: 'form-1', tenantId, definition: { sharepointConfigurationId: destination } }) as unknown as FormEntity;
  const aSubmission = () => ({ id: 'submission-1' }) as unknown as FormSubmissionEntity;
  const aPush = (props: Partial<SharePointPush> = {}): SharePointPush => ({
    id: 'push-1',
    tenantId,
    formId: 'form-1',
    submissionId: 'submission-1',
    attempts: 2,
    nextAttemptAt: now,
    ...props,
  });

  const failure = (errorCode: string, retryable: boolean): SharePointPushResult => ({
    success: false,
    errorCode,
    retryable,
  });

  let service: SharePointPushRetryService;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers().setSystemTime(now);
    repository.create.mockResolvedValue(undefined);
    repository.claimDue.mockResolvedValue(null);
    client.push.mockResolvedValue({ success: true });
    service = new SharePointPushRetryService({
      apiId,
      logger,
      client,
      repository,
      formRepository,
      submissionRepository,
      eventService,
      retryDelaysSeconds: delays,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('push', () => {
    it('stores the push before the first attempt and removes it when the attempt succeeds', async () => {
      const result = await service.push(aForm(), aSubmission());

      expect(result).toEqual({ success: true });
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId, formId: 'form-1', submissionId: 'submission-1', attempts: 1 }),
      );
      expect(repository.create.mock.invocationCallOrder[0]).toBeLessThan(client.push.mock.invocationCallOrder[0]);
      expect(repository.delete).toHaveBeenCalledTimes(1);
      expect(eventService.send).not.toHaveBeenCalled();
    });

    it('does not store form data', async () => {
      await service.push(aForm(), aSubmission());

      expect(Object.keys(repository.create.mock.calls[0][0]).sort()).toEqual(
        ['attempts', 'formId', 'id', 'nextAttemptAt', 'submissionId', 'tenantId'].sort(),
      );
    });

    it('schedules the first retry after the first delay when a failure may pass', async () => {
      client.push.mockResolvedValue(failure('graph:serviceNotAvailable', true));

      const result = await service.push(aForm(), aSubmission());

      expect(result).toEqual(failure('graph:serviceNotAvailable', true));
      expect(repository.reschedule).toHaveBeenCalledWith(
        expect.any(String),
        new Date(now.getTime() + 60 * 1000),
        'graph:serviceNotAvailable',
      );
      expect(repository.delete).not.toHaveBeenCalled();
      expect(eventService.send).not.toHaveBeenCalled();
    });

    it('gives up at once, with the event, when the failure cannot be fixed by retrying', async () => {
      client.push.mockResolvedValue(failure('credential-not-set', false));

      await service.push(aForm(), aSubmission());

      expect(repository.reschedule).not.toHaveBeenCalled();
      expect(repository.delete).toHaveBeenCalledTimes(1);
      expect(eventService.send).toHaveBeenCalledTimes(1);
      expect(eventService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: SHAREPOINT_PUSH_FAILED,
          tenantId,
          payload: {
            formId: 'form-1',
            submissionId: 'submission-1',
            destinationId: 'hr-intake',
            errorCode: 'credential-not-set',
            attempts: 1,
          },
        }),
      );
    });

    it('sends a null submission ID for a form without a submission', async () => {
      client.push.mockResolvedValue(failure('credential-not-set', false));

      await service.push(aForm());

      expect(eventService.send).toHaveBeenCalledWith(
        expect.objectContaining({ payload: expect.objectContaining({ submissionId: null }) }),
      );
    });

    it('still attempts the push once when it cannot be stored, and does not throw', async () => {
      repository.create.mockRejectedValue(new Error('db down'));
      client.push.mockResolvedValue(failure('network', true));

      await expect(service.push(aForm(), aSubmission())).resolves.toEqual(failure('network', true));

      expect(client.push).toHaveBeenCalledTimes(1);
      expect(repository.reschedule).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('does not throw when recording the outcome fails', async () => {
      repository.delete.mockRejectedValue(new Error('db down'));

      await expect(service.push(aForm(), aSubmission())).resolves.toEqual({ success: true });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('retryDue', () => {
    beforeEach(() => {
      formRepository.get.mockResolvedValue(aForm());
      submissionRepository.get.mockResolvedValue(aSubmission());
    });

    it('does nothing when no push is due', async () => {
      expect(await service.retryDue()).toBe(0);
      expect(client.push).not.toHaveBeenCalled();
    });

    it('reads the form and submission again and removes the push when the retry succeeds', async () => {
      repository.claimDue.mockResolvedValueOnce(aPush());

      expect(await service.retryDue()).toBe(1);

      expect(formRepository.get).toHaveBeenCalledWith(tenantId, 'form-1');
      expect(submissionRepository.get).toHaveBeenCalledWith(tenantId, 'submission-1', 'form-1');
      expect(client.push).toHaveBeenCalledWith(aForm(), aSubmission());
      expect(repository.delete).toHaveBeenCalledWith('push-1');
      expect(eventService.send).not.toHaveBeenCalled();
    });

    it('schedules the next retry with the delay for the attempt', async () => {
      repository.claimDue.mockResolvedValueOnce(aPush({ attempts: 2 }));
      client.push.mockResolvedValue(failure('network', true));

      await service.retryDue();

      expect(repository.reschedule).toHaveBeenCalledWith('push-1', new Date(now.getTime() + 300 * 1000), 'network');
      expect(eventService.send).not.toHaveBeenCalled();
    });

    it('sends the event once, with the attempt count, when the last attempt fails', async () => {
      repository.claimDue.mockResolvedValueOnce(aPush({ attempts: 3 }));
      client.push.mockResolvedValue(failure('entra:AADSTS7000222', true));

      await service.retryDue();

      expect(repository.reschedule).not.toHaveBeenCalled();
      expect(repository.delete).toHaveBeenCalledWith('push-1');
      expect(eventService.send).toHaveBeenCalledTimes(1);
      expect(eventService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ errorCode: 'entra:AADSTS7000222', attempts: 3 }),
        }),
      );
    });

    it('stops retrying and sends the event when a retry fails in a way that cannot pass', async () => {
      repository.claimDue.mockResolvedValueOnce(aPush({ attempts: 2 }));
      client.push.mockResolvedValue(failure('destination-disabled', false));

      await service.retryDue();

      expect(repository.reschedule).not.toHaveBeenCalled();
      expect(eventService.send).toHaveBeenCalledTimes(1);
    });

    it('gives up without another push when earlier attempts used up all the attempts', async () => {
      repository.claimDue.mockResolvedValueOnce(aPush({ attempts: 4, lastErrorCode: 'network' }));

      await service.retryDue();

      expect(client.push).not.toHaveBeenCalled();
      expect(eventService.send).toHaveBeenCalledWith(
        expect.objectContaining({ payload: expect.objectContaining({ errorCode: 'network', attempts: 4 }) }),
      );
    });

    it('drops the push without an event when the form no longer exists', async () => {
      repository.claimDue.mockResolvedValueOnce(aPush());
      formRepository.get.mockResolvedValue(null);

      await service.retryDue();

      expect(client.push).not.toHaveBeenCalled();
      expect(repository.delete).toHaveBeenCalledWith('push-1');
      expect(eventService.send).not.toHaveBeenCalled();
    });

    it('drops the push without an event when the form no longer has a destination', async () => {
      repository.claimDue.mockResolvedValueOnce(aPush());
      formRepository.get.mockResolvedValue(aForm(null));

      await service.retryDue();

      expect(client.push).not.toHaveBeenCalled();
      expect(repository.delete).toHaveBeenCalledWith('push-1');
      expect(eventService.send).not.toHaveBeenCalled();
    });

    it('drops the push when its submission no longer exists', async () => {
      repository.claimDue.mockResolvedValueOnce(aPush());
      submissionRepository.get.mockResolvedValue(null);

      await service.retryDue();

      expect(client.push).not.toHaveBeenCalled();
      expect(repository.delete).toHaveBeenCalledWith('push-1');
    });

    it('retries a push without a submission', async () => {
      repository.claimDue.mockResolvedValueOnce(aPush({ submissionId: undefined }));

      await service.retryDue();

      expect(submissionRepository.get).not.toHaveBeenCalled();
      expect(client.push).toHaveBeenCalledWith(aForm(), undefined);
    });

    it('keeps the push for a later run when the retry cannot be processed', async () => {
      repository.claimDue.mockResolvedValueOnce(aPush());
      formRepository.get.mockRejectedValue(new Error('db down'));

      await expect(service.retryDue()).resolves.toBe(1);

      expect(repository.delete).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    });

    it('works through the due pushes, up to a limit per run', async () => {
      repository.claimDue.mockResolvedValue(aPush());

      expect(await service.retryDue()).toBe(20);
    });
  });

  describe('parseRetryDelays', () => {
    it('reads a list of seconds', () => {
      expect(parseRetryDelays('60, 300,1800')).toEqual([60, 300, 1800]);
    });

    it.each(['', 'soon', '60,,300', '60,-5', '0'])('rejects %p', (value) => {
      expect(() => parseRetryDelays(value)).toThrow('comma separated list of seconds');
    });
  });
});
