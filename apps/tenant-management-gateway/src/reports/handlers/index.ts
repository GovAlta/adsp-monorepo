import { ValueServiceClient } from '../client';
import { ReportCatalog } from '../types';
import { pdfSummarySource } from './pdf/summary';
import { createSummaryHandler } from './summary';

/**
 * serviceId × sectionId → handler. Missing entry is 404.
 * Adding Form: handlers/form/summary.ts plus catalog.form.summary below.
 */
export function createReportCatalog(client: ValueServiceClient): ReportCatalog {
  return {
    pdf: {
      summary: createSummaryHandler(client, pdfSummarySource),
    },
  };
}
