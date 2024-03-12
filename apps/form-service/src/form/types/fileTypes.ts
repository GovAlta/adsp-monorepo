import { FileType, SecurityClassifications } from '@abgov/adsp-service-sdk';
import { FormServiceRoles } from '../roles';

export const FORM_SUPPORTING_DOCS = 'form-supporting-documents';
export const GeneratedSupportingDocFileType: FileType = {
  id: FORM_SUPPORTING_DOCS,
  name: 'Form supporting documents',
  anonymousRead: false,
  securityClassification: SecurityClassifications.ProtectedB,
  readRoles: [`urn:ads:platform:form-service:${FormServiceRoles.FileReader}`],
  updateRoles: [`urn:ads:platform:form-service:${FormServiceRoles.FileUploader}`],
};
