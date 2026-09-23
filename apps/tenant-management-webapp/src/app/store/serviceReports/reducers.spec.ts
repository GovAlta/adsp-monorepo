import {
  loadReportSection,
  loadReportSectionFailure,
  loadReportSectionSuccess,
  setReportCriteria,
} from './actions';
import { ReportingPeriod, ServiceReportsState } from './models';
import reducer from './reducers';
import { resolvePeriodRange } from './selectors';

const last30: ReportingPeriod = { preset: 'last30Days', ...resolvePeriodRange('last30Days') };
const last7: ReportingPeriod = { preset: 'last7Days', ...resolvePeriodRange('last7Days') };

const withPdfSummary = (state: ServiceReportsState, data: unknown): ServiceReportsState =>
  reducer(state, loadReportSectionSuccess('pdf', 'summary', 'pdf|last30Days|a|b', data));

describe('serviceReports reducer', () => {
  it('starts with a null service and the last-30-days period', () => {
    const state = reducer(undefined, { type: '@@INIT' } as never);

    expect(state.criteria).toEqual({ serviceId: null, period: last30 });
  });

  it('starts with no section state', () => {
    const state = reducer(undefined, { type: '@@INIT' } as never);

    expect(state.sections).toEqual({});
  });

  it('replaces criteria on SET_REPORT_CRITERIA', () => {
    const state = reducer(undefined, setReportCriteria('pdf', last7));

    expect(state.criteria).toEqual({ serviceId: 'pdf', period: last7 });
  });

  it('preserves existing section state when criteria change', () => {
    const loaded = withPdfSummary(reducer(undefined, { type: '@@INIT' } as never), { pdfGenerated: 3 });

    const next = reducer(loaded, setReportCriteria('pdf', last7));

    expect(next.sections.pdf.summary.data).toEqual({ pdfGenerated: 3 });
  });

  it('sets a section to loading without clearing existing data', () => {
    const loaded = withPdfSummary(reducer(undefined, { type: '@@INIT' } as never), { pdfGenerated: 3 });

    const next = reducer(loaded, loadReportSection('pdf', 'summary'));

    expect(next.sections.pdf.summary).toEqual(
      expect.objectContaining({ status: 'loading', data: { pdfGenerated: 3 } })
    );
  });

  it('clears a previous error when a section starts loading', () => {
    const failed = reducer(
      undefined,
      loadReportSectionFailure('pdf', 'summary', 'pdf-key', 'gateway unavailable')
    );

    const next = reducer(failed, loadReportSection('pdf', 'summary'));

    expect(next.sections.pdf.summary.error).toBeUndefined();
    expect(next.sections.pdf.summary.status).toBe('loading');
  });

  it('stores data and the criteria key on success', () => {
    const state = reducer(undefined, loadReportSectionSuccess('pdf', 'summary', 'pdf|last30Days|a|b', { pdfGenerated: 9 }));

    expect(state.sections.pdf.summary).toEqual({
      status: 'loaded',
      data: { pdfGenerated: 9 },
      loadedForKey: 'pdf|last30Days|a|b',
      error: undefined,
    });
  });

  it('sets the error and keeps existing data on failure', () => {
    const loaded = withPdfSummary(reducer(undefined, { type: '@@INIT' } as never), { pdfGenerated: 3 });

    const next = reducer(loaded, loadReportSectionFailure('pdf', 'summary', 'pdf|last7Days|a|b', 'network down'));

    expect(next.sections.pdf.summary).toEqual(
      expect.objectContaining({
        status: 'error',
        error: 'network down',
        data: { pdfGenerated: 3 },
        loadedForKey: 'pdf|last7Days|a|b',
      })
    );
  });

  it('keeps section state for different services isolated', () => {
    const pdfLoaded = reducer(
      undefined,
      loadReportSectionSuccess('pdf', 'summary', 'pdf-key', { pdfGenerated: 1 })
    );
    const both = reducer(pdfLoaded, loadReportSectionSuccess('form', 'summary', 'form-key', { formsSubmitted: 2 }));

    expect(both.sections.pdf.summary.data).toEqual({ pdfGenerated: 1 });
    expect(both.sections.form.summary.data).toEqual({ formsSubmitted: 2 });
  });
});
