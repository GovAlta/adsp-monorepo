import { FileType, SecurityClassifications } from '@abgov/adsp-service-sdk';
import { ServiceRoles } from './roles';

export const PDF_TEMPLATE_ASSETS = 'pdf-template-assets';
export const PdfTemplateAssetsType: FileType = {
  id: PDF_TEMPLATE_ASSETS,
  name: 'PDF template assets',
  // Puppeteer fetches images embedded in templates (via the fileId helper) without
  // credentials, so assets must be anonymously readable to render in generated documents.
  anonymousRead: true,
  securityClassification: SecurityClassifications.Public,
  readRoles: [],
  updateRoles: [`urn:ads:platform:pdf-service:${ServiceRoles.PdfGenerator}`],
  // No retention rule: templates reference these assets indefinitely.
};

export const GENERATED_PDF = 'generated-pdf';
export const GeneratedPdfType: FileType = {
  id: GENERATED_PDF,
  name: 'Generated PDF',
  anonymousRead: false,
  securityClassification: SecurityClassifications.ProtectedA,
  readRoles: [
    `urn:ads:platform:pdf-service:${ServiceRoles.PdfGenerator}`,
    'urn:ads:platform:tenant-service:platform-service',
  ],
  updateRoles: ['urn:ads:platform:tenant-service:platform-service'],
  rules: {
    retention: {
      active: true,
      deleteInDays: 30,
    },
  },
};
