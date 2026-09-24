import { pdfReport } from './services/pdfReport';
import {
  getAvailableServiceReports,
  getDefaultServiceReport,
  getSectionLoader,
  getServiceReport,
  registerSectionLoader,
  resetSectionLoaders,
} from './serviceReportRegistry';

describe('serviceReportRegistry', () => {
  afterEach(() => {
    resetSectionLoaders();
  });

  it('returns the PDF descriptor for id pdf', () => {
    expect(getServiceReport('pdf')).toEqual(pdfReport);
  });

  it('returns undefined for an unknown service id', () => {
    expect(getServiceReport('unknown-service')).toBeUndefined();
  });

  it('excludes a registered service that is feature-flagged off', () => {
    const reports = getAvailableServiceReports({ PDF: false });

    expect(reports.find((report) => report.id === 'pdf')).toBeUndefined();
  });

  it('includes PDF when the service is enabled', () => {
    const reports = getAvailableServiceReports({ PDF: true });

    expect(reports).toEqual([pdfReport]);
  });

  it('selects the first available report as the default', () => {
    expect(getDefaultServiceReport({ PDF: true })).toEqual(pdfReport);
  });

  it('returns undefined for the default report when no service is available', () => {
    expect(getDefaultServiceReport({ PDF: false })).toBeUndefined();
  });

  it('returns undefined from getSectionLoader when none is registered', () => {
    expect(getSectionLoader('pdf', 'summary')).toBeUndefined();
  });

  it('returns a loader after it is registered for that service and section', () => {
    const loader = jest.fn();

    registerSectionLoader('test-service', 'insights', loader);

    expect(getSectionLoader('test-service', 'insights')).toBe(loader);
  });

  it('lists the PDF summary metric ids the gateway payload must use', () => {
    expect(pdfReport.summaryMetrics?.map((metric) => metric.id)).toEqual([
      'pdfRequested',
      'pdfGenerated',
      'pdfFailed',
      'unreconciled',
      'generationDuration',
      'generationDurationMax',
      'templatesUsed',
    ]);
  });
});
