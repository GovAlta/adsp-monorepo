import { FileType, SecurityClassifications } from '@abgov/adsp-service-sdk';
import { FormServiceRoles } from '../roles';

export const FORM_SUPPORTING_DOCS = 'form-supporting-documents';
export const FORM_SUPPORTING_ANONYMOUS_DOCS = 'form-anonymous-supporting-documents';

export const FormSupportingDocFileType: FileType = {
  id: FORM_SUPPORTING_DOCS,
  name: 'Form supporting documents',
  anonymousRead: false,
  securityClassification: SecurityClassifications.ProtectedB,
  readRoles: [`urn:ads:platform:form-service:${FormServiceRoles.FileReader}`],
  updateRoles: [
    `urn:ads:platform:form-service:${FormServiceRoles.FileUploader}`,
    `urn:ads:platform:form-service:${FormServiceRoles.IntakeApp}`,
  ],
};

export const FORM_EXPORT_FILE = 'form-export';

export const FormExportFileType: FileType = {
  id: FORM_EXPORT_FILE,
  name: 'Form and submission export',
  anonymousRead: false,
  securityClassification: SecurityClassifications.ProtectedB,
  readRoles: [`urn:ads:platform:form-service:${FormServiceRoles.Admin}`],
  updateRoles: ['urn:ads:platform:tenant-service:platform-service'],
  rules: {
    retention: {
      active: true,
      deleteInDays: 30,
    },
  },
};
