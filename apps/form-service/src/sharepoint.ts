import { adspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { Logger } from 'winston';
import { FormEntity, FormSubmissionEntity, SharePointPushResult, SharePointService } from './form';

const SHAREPOINT_SERVICE_ID = adspId`urn:ads:platform:sharepoint-service`;
const REQUEST_TIMEOUT_MS = 70000;
const GATEWAY_STATUSES = [502, 503, 504];
const SUBMISSION_PDF_FIELD = '_adsp.submissionPdf';

interface FailureDetail {
  errorCode?: string;
  retryable?: boolean;
}

interface PushResponseBody extends FailureDetail {
  files?: (FailureDetail & { status: string })[];
  row?: FailureDetail & { written: boolean };
}

function toFailure(err: unknown): SharePointPushResult {
  if (!axios.isAxiosError(err)) {
    return { success: false, errorCode: 'unknown', retryable: false };
  }
  if (!err.response) {
    return { success: false, errorCode: 'network', retryable: true };
  }

  const body = (err.response.data || {}) as PushResponseBody;
  const failures: FailureDetail[] = [
    ...(body.files || []).filter(({ status }) => status === 'failed'),
    ...(body.row && !body.row.written ? [body.row] : []),
    ...(body.errorCode ? [body] : []),
  ];
  if (failures.length > 0) {
    return {
      success: false,
      errorCode: failures[0].errorCode || 'unknown',
      retryable: failures.every(({ retryable }) => retryable === true),
    };
  }

  // The route or a restarting pod answered instead of the service. The push may or may not have happened, which is
  // safe to repeat when the destination updates rows by key.
  return {
    success: false,
    errorCode: `http:${err.response.status}`,
    retryable: GATEWAY_STATUSES.includes(err.response.status),
  };
}

function toPushRequest(
  form: FormEntity,
  submission?: FormSubmissionEntity,
  submissionPdfFileId?: string,
): { path: 'files' | 'data'; body: unknown; fileCount: number } {
  const key = submission?.id ?? form.id;
  const _adsp = { key, formId: form.id, submittedAt: form.submitted?.toISOString() };

  if (submissionPdfFileId) {
    // The submission's own push writes the row, so this only adds the PDF's link to it once it's there.
    const files = [{ field: SUBMISSION_PDF_FIELD, fileId: submissionPdfFileId }];
    return { path: 'files', body: { submissionId: key, files, data: { _adsp }, updateRowOnly: true }, fileCount: 1 };
  }

  const files = Object.entries(submission?.formFiles ?? form.files ?? {})
    .filter(([, urn]) => !!urn)
    .map(([field, urn]) => ({ field, fileId: urn.toString() }));
  const data = { ...(submission?.formData ?? form.data ?? {}), _adsp };
  return files.length > 0
    ? { path: 'files', body: { submissionId: key, files, data }, fileCount: files.length }
    : { path: 'data', body: data, fileCount: 0 };
}

class SharePointServiceImpl implements SharePointService {
  constructor(
    private logger: Logger,
    private directory: ServiceDirectory,
    private tokenProvider: TokenProvider,
  ) {}

  async push(
    form: FormEntity,
    submission?: FormSubmissionEntity,
    submissionPdfFileId?: string,
  ): Promise<SharePointPushResult> {
    const destinationId = form.definition?.sharepointConfigurationId;
    try {
      const { path, body, fileCount } = toPushRequest(form, submission, submissionPdfFileId);

      this.logger.debug(
        `Pushing form (ID: ${form.id}) to SharePoint destination '${destinationId}' with ${fileCount} file(s)...`,
        { context: 'SharePointService', tenant: form.tenantId.toString() },
      );

      const baseUrl = await this.directory.getServiceUrl(SHAREPOINT_SERVICE_ID);
      const url = new URL(`/sharepoint/v1/destinations/${encodeURIComponent(destinationId)}/${path}`, baseUrl);

      const token = await this.tokenProvider.getAccessToken();
      await axios.post(url.href, body, {
        headers: { Authorization: `Bearer ${token}` },
        params: { tenantId: form.tenantId.toString() },
        timeout: REQUEST_TIMEOUT_MS,
      });

      return { success: true };
    } catch (err) {
      return toFailure(err);
    }
  }
}

export function createSharePointService(
  logger: Logger,
  directory: ServiceDirectory,
  tokenProvider: TokenProvider,
): SharePointService {
  return new SharePointServiceImpl(logger, directory, tokenProvider);
}
