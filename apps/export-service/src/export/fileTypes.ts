import { FileType, SecurityClassifications } from '@abgov/adsp-service-sdk';
import { ServiceRoles } from './roles';

export const EXPORT_FILE = 'export-file';
export const ExportFileType: FileType = {
  id: EXPORT_FILE,
  name: 'Export file',
  anonymousRead: false,
  securityClassification: SecurityClassifications.ProtectedB,
  readRoles: [`urn:ads:platform:export-service:${ServiceRoles.Exporter}`],
  updateRoles: [`urn:ads:platform:tenant-service:platform-service`],
  rules: {
    retention: {
      active: true,
      createdAt: '2023-04-20T17:19:22Z',
      deleteInDays: 30,
    },
  },
};
