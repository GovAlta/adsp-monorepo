import { AdspId, EventService } from '@abgov/adsp-service-sdk';
import { DomainEvent } from '@core-services/core-common';
import { Logger } from 'winston';
import { FORM_SUBMITTED, sharePointPushFailed } from '../events';
import { FormRepository, FormSubmissionRepository } from '../repository';
import { SharePointService } from '../sharepoint';

const PDF_SERVICE_NAMESPACE = 'pdf-service';
const PDF_GENERATED = 'pdf-generated';
const PDF_GENERATION_FAILED = 'pdf-generation-failed';
const SUBMITTED_TRIGGER = `form-service:${FORM_SUBMITTED}`;

const LOG_CONTEXT = { context: 'SubmissionPdfJob' };

export interface SubmissionPdfJobProps {
  apiId: AdspId;
  logger: Logger;
  repository: FormRepository;
  submissionRepository: FormSubmissionRepository;
  sharepointService: SharePointService;
  eventService: EventService;
}

/**
 * Pushes the submission PDF to the form's SharePoint destination once PDF Service has generated it, or tells the
 * tenant through the push-failed event that it could not be generated. The submission itself is pushed on submit.
 */
export function createSubmissionPdfJob({
  apiId,
  logger,
  repository,
  submissionRepository,
  sharepointService,
  eventService,
}: SubmissionPdfJobProps) {
  return async function (event: DomainEvent): Promise<void> {
    if (event?.namespace !== PDF_SERVICE_NAMESPACE || ![PDF_GENERATED, PDF_GENERATION_FAILED].includes(event.name)) {
      return;
    }

    const { trigger, formId, submissionId, templateId } = (event.context ?? {}) as Record<string, string>;
    if (trigger !== SUBMITTED_TRIGGER || !formId) {
      return;
    }

    try {
      const tenantId = event.tenantId;
      const form = await repository.get(tenantId, formId);
      const destinationId = form?.definition?.sharepointConfigurationId;
      if (!destinationId || form.dryRun || templateId !== form.definition.submissionPdfTemplate) {
        return;
      }

      // Jobs requested before the submission ID was added to the PDF job context can't be matched to their row.
      if (form.definition.submissionRecords && !submissionId) {
        logger.info(`Skipped submission PDF of form (ID: ${formId}) with no submission ID.`, LOG_CONTEXT);
        return;
      }

      if (event.name === PDF_GENERATION_FAILED) {
        eventService.send(
          sharePointPushFailed(
            apiId,
            { tenantId, formId, submissionId },
            'submission-pdf',
            destinationId,
            PDF_GENERATION_FAILED,
            event.timestamp,
          ),
        );
        logger.warn(`Submission PDF of form (ID: ${formId}) was not generated, so it is not pushed.`, LOG_CONTEXT);
        return;
      }

      const submission = submissionId ? await submissionRepository.get(tenantId, submissionId, formId) : undefined;
      const fileUrn = (event.payload?.file as { urn?: string })?.urn;
      if ((submissionId && !submission) || !fileUrn) {
        logger.info(`Skipped submission PDF of form (ID: ${formId}) with no submission or file.`, LOG_CONTEXT);
        return;
      }

      const result = await sharepointService.push(form, submission, fileUrn);
      if (result.success === false) {
        logger.warn(
          `Failed to push submission PDF of form (ID: ${formId}) to SharePoint: ${result.errorCode} ` +
            `(retryable: ${result.retryable}).`,
          LOG_CONTEXT,
        );
      }
    } catch (err) {
      logger.error(
        `Error encountered pushing submission PDF of form (ID: ${formId}) to SharePoint. ${err}`,
        LOG_CONTEXT,
      );
    }
  };
}
