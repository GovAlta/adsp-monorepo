import { adspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { Logger } from 'winston';
import { FormEntity, FormSubmissionEntity, PdfService } from './form';

class PdfServiceImpl implements PdfService {
  constructor(private logger: Logger, private directory: ServiceDirectory, private tokenProvider: TokenProvider) {}

  async generateFormPdf(form: FormEntity, submission?: FormSubmissionEntity): Promise<string> {
    try {
      this.logger.debug(`Requesting PDF generation for form (ID: ${form.id})...`, {
        context: 'PdfService',
        tenant: form.tenantId.toString(),
      });

      const pdfData = {
        definition: {
          id: form.definition.id,
          name: form.definition.name,
          dataSchema: form.definition.dataSchema,
          uiSchema: form.definition.uiSchema,
        },
        form: {
          id: form.id,
          submitted: form.submitted,
          securityClassification: form.securityClassification,
        },
        content: { data: form.data },
      };

      const recordId = `urn:ads:platform:form-service:v1:/forms/${form.id}${
        submission?.id ? `/submissions/${submission.id}` : ''
      }`;

      const pdfGenerateBody = {
        operation: 'generate',
        templateId: form.definition.submissionPdfTemplate,
        data: pdfData,
        filename: `${form.definition.submissionPdfTemplate}-${form.definition.id}.pdf`,
        recordId: recordId,
      };

      const baseUrl = await this.directory.getServiceUrl(adspId`urn:ads:platform:pdf-service`);
      const configUrl = new URL(`/pdf/v1/jobs`, baseUrl);

      const token = await this.tokenProvider.getAccessToken();
      const { data } = await axios.post<{ id: string }>(configUrl.href, pdfGenerateBody, {
        headers: { Authorization: `Bearer ${token}` },
        params: { tenantId: form.tenantId.toString() },
      });

      this.logger.info(`Requested PDF generation for form (ID: ${form.id}) with result job ID: ${data.id}`, {
        context: 'PdfService',
        tenant: form.tenantId.toString(),
      });

      return data.id;
    } catch (err) {
      this.logger.warn(`Error encountered requesting PDF generation for form (ID: ${form.id}): ${err}`, {
        context: 'PdfService',
        tenant: form.tenantId?.toString(),
      });

      return null;
    }
  }
}

export function createPdfService(logger: Logger, directory: ServiceDirectory, tokenProvider: TokenProvider) {
  return new PdfServiceImpl(logger, directory, tokenProvider);
}
