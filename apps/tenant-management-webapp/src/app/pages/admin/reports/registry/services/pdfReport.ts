import { ServiceReportDescriptor } from '../types';

export const pdfReport: ServiceReportDescriptor = {
  id: 'pdf',
  label: 'PDF',
  serviceUrn: 'urn:ads:platform:pdf-service',
  featureName: 'PDF',
  sections: ['summary', 'trends', 'topResources', 'insights', 'apiDrilldown'],
  summaryMetrics: [
    { id: 'pdfGenerated', label: 'PDFs generated', format: 'count' },
    { id: 'pdfFailed', label: 'PDFs failed', format: 'count' },
    { id: 'generationDuration', label: 'Average time to generate', format: 'duration' },
  ],
  topResourcesLabel: 'Templates',
};
