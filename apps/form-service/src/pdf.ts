import { adspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { Logger } from 'winston';
import { FormEntity, FormSubmissionEntity, PdfService } from './form';

class PdfServiceImpl implements PdfService {
  constructor(private logger: Logger, private directory: ServiceDirectory, private tokenProvider: TokenProvider) {}

  // TODO: this should be done with a library.
  private extractCurrentRefs = async (dataSchema) => {
    const properties = dataSchema?.properties || dataSchema?.definitions || [];
    let propertyName = dataSchema?.definitions && 'definitions';
    propertyName = dataSchema?.properties ? 'properties' : null;

    const result = JSON.parse(JSON.stringify(dataSchema));

    for (const prop of Object.keys(properties)) {
      if (properties[prop].$ref) {
        try {
          const refArray = properties[prop].$ref.split('#/');

          // eslint-disable-next-line
          const { data } = await axios.get<Record<string, Record<string, any[]>>>(properties[prop].$ref);

          // eslint-disable-next-line
          let parsedData = Object.assign({}, data) as any;

          refArray[1].split('/').forEach((key) => {
            parsedData = parsedData[key];
          });

          const resolvedData = await this.extractCurrentRefs(parsedData);
          result[propertyName][prop] = resolvedData;
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      } else if (properties[prop].type === 'object') {
        result[propertyName][prop] = await this.extractCurrentRefs(properties[prop]);
      } else {
        result[propertyName][prop] = properties[prop];
      }
    }

    if (result?.allOf) {
      if (!result[propertyName]) {
        result[propertyName] = {};
      }
      result[propertyName].allOf = await Promise.all(
        result.allOf.map(async (item) => {
          return await this.extractCurrentRefs(item);
        })
      );
    }

    return result;
  };

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
          dataSchema: form.definition.dataSchema
            ? await this.extractCurrentRefs(form.definition.dataSchema)
            : form.definition.dataSchema,
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
