import { ServiceSummarySource } from '../summary';

/**
 * PDF summary cards. Ids must match TMW `pdfReport.summaryMetrics[].id`.
 *
 * Form / notification get handlers/<service>/summary.ts with the same shape, then a catalog line.
 */
export const pdfSummarySource: ServiceSummarySource = {
  metricLike: 'pdf-service',
  fields: [
    { id: 'pdfRequested', type: 'sum', metric: 'pdf-service:pdf-generation-queued:count' },
    { id: 'pdfGenerated', type: 'sum', metric: 'pdf-service:pdf-generated:count' },
    { id: 'pdfFailed', type: 'sum', metric: 'pdf-service:pdf-generation-failed:count' },
    { id: 'unreconciled', type: 'unreconciled', requestedId: 'pdfRequested', generatedId: 'pdfGenerated' },
    { id: 'generationDuration', type: 'avg', metric: 'pdf-service:pdf-generation:duration' },
    { id: 'generationDurationMax', type: 'max', metric: 'pdf-service:pdf-generation:duration' },
    {
      id: 'templatesUsed',
      type: 'distinct',
      query: {
        namespace: 'pdf-service',
        eventNames: ['pdf-generation-queued', 'pdf-generated', 'pdf-generation-failed'],
        contextKey: 'templateId',
      },
    },
  ],
};
