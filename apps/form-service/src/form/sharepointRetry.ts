import { AdspId, EventService } from '@abgov/adsp-service-sdk';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from 'winston';
import { sharePointPushFailed } from './events';
import { FormEntity, FormSubmissionEntity } from './model';
import { FormRepository, FormSubmissionRepository } from './repository';
import {
  SharePointPush,
  SharePointPushRepository,
  SharePointPushResult,
  SharePointRetryService,
  SharePointService,
} from './sharepoint';

const LOG_CONTEXT = { context: 'SharePointRetryService' };

// The push has to finish inside this time, so a pod that dies mid-attempt leaves a push that falls due again.
const ATTEMPT_LEASE_MS = 3 * 60 * 1000;
const MAX_PUSHES_PER_RUN = 20;

export const DEFAULT_RETRY_DELAYS_SECONDS = '60,300,1800,7200';

export function parseRetryDelays(value: string): number[] {
  const delays = value.split(',').map((delay) => Number(delay.trim()));
  if (delays.some((delay) => !Number.isFinite(delay) || delay <= 0)) {
    throw new Error(`Retry delays must be a comma separated list of seconds, but got '${value}'.`);
  }
  return delays;
}

interface SharePointRetryServiceProps {
  apiId: AdspId;
  logger: Logger;
  client: SharePointService;
  repository: SharePointPushRepository;
  formRepository: FormRepository;
  submissionRepository: FormSubmissionRepository;
  eventService: EventService;
  // Seconds to wait after each failed attempt, so one more than this many attempts are made in total.
  retryDelaysSeconds: number[];
}

// Wraps the push to SharePoint so a failure that may pass is tried again later, including after a restart.
// A push is stored before it is first attempted, and removed once it succeeds or is given up on.
export class SharePointPushRetryService implements SharePointRetryService {
  private maxAttempts: number;

  constructor(private props: SharePointRetryServiceProps) {
    this.maxAttempts = props.retryDelaysSeconds.length + 1;
  }

  async push(
    form: FormEntity,
    submission?: FormSubmissionEntity,
    submissionPdfFileId?: string,
  ): Promise<SharePointPushResult> {
    const pending = await this.store(form, submission, submissionPdfFileId);
    const result = await this.props.client.push(form, submission, submissionPdfFileId);
    if (pending) {
      await this.settle(pending, form.definition?.sharepointConfigurationId, result);
    }
    return result;
  }

  async retryDue(): Promise<number> {
    let attempted = 0;
    while (attempted < MAX_PUSHES_PER_RUN) {
      const pending = await this.props.repository.claimDue(new Date(), ATTEMPT_LEASE_MS);
      if (!pending) {
        break;
      }
      attempted++;
      await this.retry(pending);
    }
    return attempted;
  }

  private async store(
    form: FormEntity,
    submission?: FormSubmissionEntity,
    submissionPdfFileId?: string,
  ): Promise<SharePointPush | null> {
    const pending: SharePointPush = {
      id: uuidv4(),
      tenantId: form.tenantId,
      formId: form.id,
      submissionId: submission?.id,
      submissionPdfFileId,
      attempts: 1,
      nextAttemptAt: new Date(Date.now() + ATTEMPT_LEASE_MS),
    };
    try {
      await this.props.repository.create(pending);
      return pending;
    } catch (err) {
      // The push is still attempted once, it just can't be repeated.
      this.props.logger.error(
        `Failed to store push of form (ID: ${form.id}) to SharePoint for retries: ${err}`,
        LOG_CONTEXT,
      );
      return null;
    }
  }

  private async retry(pending: SharePointPush): Promise<void> {
    const { logger, formRepository, submissionRepository, client } = this.props;
    try {
      const form = await formRepository.get(pending.tenantId, pending.formId);
      const destinationId = form?.definition?.sharepointConfigurationId;
      const submission = pending.submissionId
        ? await submissionRepository.get(pending.tenantId, pending.submissionId, pending.formId)
        : undefined;
      if (!destinationId || (pending.submissionId && !submission)) {
        logger.info(
          `Dropped retry of form (ID: ${pending.formId}) to SharePoint because the form, submission or destination no longer exists.`,
          LOG_CONTEXT,
        );
        await this.props.repository.delete(pending.id);
        return;
      }

      if (pending.attempts > this.maxAttempts) {
        // Attempts that never finished, for example because the pod died each time, still count.
        await this.giveUp(pending, destinationId, pending.lastErrorCode ?? 'unknown');
        return;
      }

      const result = await client.push(form, submission, pending.submissionPdfFileId);
      await this.settle(pending, destinationId, result);
    } catch (err) {
      logger.error(
        `Error encountered retrying push of form (ID: ${pending.formId}) to SharePoint: ${err}`,
        LOG_CONTEXT,
      );
    }
  }

  private async settle(pending: SharePointPush, destinationId: string, result: SharePointPushResult): Promise<void> {
    const { logger, repository, retryDelaysSeconds } = this.props;
    try {
      if (result.success === true) {
        await repository.delete(pending.id);
        return;
      }

      const delaySeconds = retryDelaysSeconds[pending.attempts - 1];
      if (result.retryable && delaySeconds !== undefined) {
        await repository.reschedule(pending.id, new Date(Date.now() + delaySeconds * 1000), result.errorCode);
        logger.info(
          `Push of form (ID: ${pending.formId}) to SharePoint failed with ${result.errorCode}. ` +
            `Attempt ${pending.attempts} of ${this.maxAttempts}, retrying in ${delaySeconds} seconds.`,
          LOG_CONTEXT,
        );
      } else {
        await this.giveUp(pending, destinationId, result.errorCode);
      }
    } catch (err) {
      logger.error(
        `Error encountered recording push of form (ID: ${pending.formId}) to SharePoint: ${err}`,
        LOG_CONTEXT,
      );
    }
  }

  private async giveUp(pending: SharePointPush, destinationId: string, errorCode: string): Promise<void> {
    const { apiId, logger, repository, eventService } = this.props;
    await repository.delete(pending.id);
    const part = pending.submissionPdfFileId ? 'submission-pdf' : 'submission';
    eventService.send(sharePointPushFailed(apiId, pending, part, destinationId, errorCode, new Date()));
    logger.error(
      `Gave up pushing form (ID: ${pending.formId}) to SharePoint after ${pending.attempts} attempt(s): ${errorCode}.`,
      LOG_CONTEXT,
    );
  }
}

export function createSharePointRetryService(props: SharePointRetryServiceProps): SharePointRetryService {
  return new SharePointPushRetryService(props);
}
