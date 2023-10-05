import { FileType, SecurityClassifications } from '@abgov/adsp-service-sdk';
import { ServiceRoles } from './roles';

export const GENERATED_PDF = 'generated-pdf';
export const GeneratedPdfType: FileType = {
  id: GENERATED_PDF,
  name: 'Generated PDF',
  anonymousRead: false,
  securityClassification: SecurityClassifications.ProtectedA,
  readRoles: [`urn:ads:platform:pdf-service:${ServiceRoles.PdfGenerator}`],
  updateRoles: [`urn:ads:platform:tenant-service:platform-service`],
  rules: {
    retention: {
      active: true,
      createdAt: '2023-04-20T17:19:22Z',
      deleteInDays: 30,
    },
  },
};
