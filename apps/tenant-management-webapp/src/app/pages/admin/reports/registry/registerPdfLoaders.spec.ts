import { pdfReport } from './services/pdfReport';
import { getSectionLoader, resetSectionLoaders } from './serviceReportRegistry';
import { registerPdfReportLoaders } from './registerPdfLoaders';

describe('registerPdfReportLoaders', () => {
  afterEach(() => {
    resetSectionLoaders();
  });

  it('registers a gateway loader for PDF summary only', () => {
    registerPdfReportLoaders();

    expect(getSectionLoader(pdfReport.id, 'summary')).toEqual(expect.any(Function));
    expect(getSectionLoader(pdfReport.id, 'trends')).toBeUndefined();
    expect(getSectionLoader(pdfReport.id, 'topResources')).toBeUndefined();
    expect(getSectionLoader(pdfReport.id, 'insights')).toBeUndefined();
    expect(getSectionLoader(pdfReport.id, 'apiDrilldown')).toBeUndefined();
  });
});
