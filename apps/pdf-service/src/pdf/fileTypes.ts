import { FileType } from '@abgov/adsp-service-sdk';
import { ServiceRoles } from './roles';

export const GENERATED_PDF = 'generated-pdf';
export const GeneratedPdfType: FileType = {
  id: GENERATED_PDF,
  name: 'Generated PDF',
  anonymousRead: false,
  readRoles: [`urn:ads:platform:pdf-service:${ServiceRoles.PdfGenerator}`],
  updateRoles: [`urn:ads:platform:tenant-service:platform-service`],
};
