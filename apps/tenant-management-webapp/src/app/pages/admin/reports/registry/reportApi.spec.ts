import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { pdfReport } from './services/pdfReport';
import { createReportSectionLoader, REPORTS_API_BASE } from './reportApi';

const period = { preset: 'last30Days' as const, from: '2026-08-12', to: '2026-09-10' };
const context = {
  descriptor: pdfReport,
  period,
  token: 'token-1',
  serviceUrls: {},
};

describe('createReportSectionLoader', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.restore();
  });

  it('requests the URL built from the descriptor id and section id', async () => {
    mock.onGet(`${REPORTS_API_BASE}/pdf/summary`).reply(200, { data: { pdfGenerated: 4 } });
    const loader = createReportSectionLoader('summary');

    await loader(context);

    expect(mock.history.get[0].url).toBe(`${REPORTS_API_BASE}/pdf/summary`);
  });

  it('sends the reporting period as query params', async () => {
    mock.onGet(`${REPORTS_API_BASE}/pdf/summary`).reply(200, { data: null });
    const loader = createReportSectionLoader('summary');

    await loader(context);

    expect(mock.history.get[0].params).toEqual({
      from: '2026-08-12',
      to: '2026-09-10',
      preset: 'last30Days',
    });
  });

  it('sends the access token as a bearer header', async () => {
    mock.onGet(`${REPORTS_API_BASE}/pdf/summary`).reply(200, { data: null });
    const loader = createReportSectionLoader('summary');

    await loader(context);

    expect(mock.history.get[0].headers.Authorization).toBe('Bearer token-1');
  });

  it('unwraps the nested data payload from the response', async () => {
    mock.onGet(`${REPORTS_API_BASE}/pdf/summary`).reply(200, { data: { pdfGenerated: 12 } });
    const loader = createReportSectionLoader('summary');

    const result = await loader(context);

    expect(result).toEqual({ pdfGenerated: 12 });
  });

  it('maps a gateway JSON 404 to null so an unsupported section is empty', async () => {
    mock
      .onGet(`${REPORTS_API_BASE}/pdf/summary`)
      .reply(404, { errorMessage: "report section with ID 'pdf/summary' could not be found." });
    const loader = createReportSectionLoader('summary');

    const result = await loader(context);

    expect(result).toBeNull();
  });

  it('throws on a proxy or HTML 404 so the UI can show an error', async () => {
    mock.onGet(`${REPORTS_API_BASE}/pdf/summary`).reply(404, '<pre>Cannot GET /api/tenant/v1/reports/pdf/summary</pre>', {
      'content-type': 'text/html',
    });
    const loader = createReportSectionLoader('summary');

    await expect(loader(context)).rejects.toThrow();
  });

  it('rethrows a non-404 error', async () => {
    mock.onGet(`${REPORTS_API_BASE}/pdf/summary`).reply(500);
    const loader = createReportSectionLoader('summary');

    await expect(loader(context)).rejects.toThrow();
  });
});
