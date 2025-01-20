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
      deleteInDays: 30,
    },
  },
};
