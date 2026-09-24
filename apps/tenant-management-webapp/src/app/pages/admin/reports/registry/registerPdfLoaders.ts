import { createReportSectionLoader } from './reportApi';
import { pdfReport } from './services/pdfReport';
import { registerSectionLoader } from './serviceReportRegistry';

/**
 * Only PDF summary has a gateway handler in this ticket.
 * Trends, top resources, insights, and API drill-down stay on placeholders until later tickets register loaders.
 */
export const registerPdfReportLoaders = (): void => {
  registerSectionLoader(pdfReport.id, 'summary', createReportSectionLoader('summary'));
};
