import { ServiceReportDescriptor } from '../types';

export const pdfReport: ServiceReportDescriptor = {
  id: 'pdf',
  label: 'PDF',
  serviceUrn: 'urn:ads:platform:pdf-service',
  featureName: 'PDF',
  sections: ['summary', 'trends', 'topResources', 'insights', 'apiDrilldown'],
  summaryMetrics: [
    { id: 'pdfRequested', label: 'PDFs requested', format: 'count' },
    { id: 'pdfGenerated', label: 'PDFs generated', format: 'count' },
    { id: 'pdfFailed', label: 'Failure attempts', format: 'count' },
    { id: 'unreconciled', label: 'Unreconciled work', format: 'count' },
    { id: 'generationDuration', label: 'Average generation time', format: 'duration' },
    { id: 'generationDurationMax', label: 'Maximum generation time', format: 'duration' },
    { id: 'templatesUsed', label: 'Templates used', format: 'count' },
  ],
  topResourcesLabel: 'Templates',
};
