import { AxiosError } from 'axios';
import * as HttpStatusCodes from 'http-status-codes';
import { expectSaga } from 'redux-saga-test-plan';
import { getAccessToken } from '@store/tenant/sagas';
import { registerSectionLoader, resetSectionLoaders } from '@pages/admin/reports/registry/serviceReportRegistry';
import { loadReportSectionFailure, loadReportSectionSuccess } from './actions';
import { loadReportSection, REPORT_SECTION_LOAD_ERROR } from './sagas';

const unauthorized = (): AxiosError => {
  const err = new AxiosError(`Request failed with status code ${HttpStatusCodes.UNAUTHORIZED}`);
  err.response = {
    status: HttpStatusCodes.UNAUTHORIZED,
    data: {},
    headers: {},
    statusText: 'Unauthorized',
    config: {},
  } as AxiosError['response'];
  return err;
};

const criteria = {
  serviceId: 'pdf',
  period: { preset: 'last30Days' as const, from: '2026-08-12', to: '2026-09-10' },
};

const storeState = {
  serviceReports: { criteria, sections: {} },
  config: { serviceUrls: {} },
};

describe('loadReportSection saga', () => {
  afterEach(() => {
    resetSectionLoaders();
  });

  it('returns without putting a result when no loader is registered', async () => {
    const { effects } = await expectSaga(loadReportSection, {
      type: 'serviceReports/LOAD_REPORT_SECTION',
      serviceId: 'pdf',
      sectionId: 'trends',
    })
      .withState(storeState)
      .run();

    expect(effects.put).toBeUndefined();
  });

  it('puts success with the loader payload', async () => {
    const payload = { pdfGenerated: 4 };
    registerSectionLoader('pdf', 'summary', async () => payload);

    const { effects } = await expectSaga(loadReportSection, {
      type: 'serviceReports/LOAD_REPORT_SECTION',
      serviceId: 'pdf',
      sectionId: 'summary',
    })
      .withState(storeState)
      .provide({
        call(effect, next) {
          if (effect.fn === getAccessToken) {
            return 'token-1';
          }
          return next();
        },
      })
      .run();

    const success = effects.put
      ?.map((effect) => effect.payload.action)
      .find((action) => action.type === 'serviceReports/LOAD_REPORT_SECTION_SUCCESS');

    expect(success).toEqual(
      loadReportSectionSuccess('pdf', 'summary', 'pdf|last30Days|2026-08-12|2026-09-10', payload)
    );
  });

  it('puts failure when the loader throws', async () => {
    registerSectionLoader('pdf', 'insights', async () => {
      throw new Error('gateway unavailable');
    });

    const { effects } = await expectSaga(loadReportSection, {
      type: 'serviceReports/LOAD_REPORT_SECTION',
      serviceId: 'pdf',
      sectionId: 'insights',
    })
      .withState(storeState)
      .provide({
        call(effect, next) {
          if (effect.fn === getAccessToken) {
            return 'token-1';
          }
          return next();
        },
      })
      .run();

    const failure = effects.put
      ?.map((effect) => effect.payload.action)
      .find((action) => action.type === 'serviceReports/LOAD_REPORT_SECTION_FAILURE');

    expect(failure).toEqual(
      loadReportSectionFailure(
        'pdf',
        'insights',
        'pdf|last30Days|2026-08-12|2026-09-10',
        REPORT_SECTION_LOAD_ERROR
      )
    );
  });

  it('does not put success when the reporting period changed during the load', async () => {
    registerSectionLoader('pdf', 'summary', async () => ({ pdfGenerated: 4 }));
    let selectCount = 0;

    const { effects } = await expectSaga(loadReportSection, {
      type: 'serviceReports/LOAD_REPORT_SECTION',
      serviceId: 'pdf',
      sectionId: 'summary',
    })
      .withState(storeState)
      .provide({
        call(effect, next) {
          if (effect.fn === getAccessToken) {
            return 'token-1';
          }
          return next();
        },
        select(effect, next) {
          selectCount += 1;
          // 1: initial criteria, 2: serviceUrls, 3: latest criteria after the loader.
          if (selectCount === 3) {
            return {
              serviceId: 'pdf',
              period: { preset: 'last7Days', from: '2026-09-04', to: '2026-09-10' },
            };
          }
          return next();
        },
      })
      .run();

    const success = effects.put
      ?.map((effect) => effect.payload.action)
      .find((action) => action.type === 'serviceReports/LOAD_REPORT_SECTION_SUCCESS');

    expect(success).toBeUndefined();
  });

  it('puts failure without calling the loader when no access token is available', async () => {
    let loaded = false;
    registerSectionLoader('pdf', 'summary', async () => {
      loaded = true;
      return { pdfGenerated: 4 };
    });

    const { effects } = await expectSaga(loadReportSection, {
      type: 'serviceReports/LOAD_REPORT_SECTION',
      serviceId: 'pdf',
      sectionId: 'summary',
    })
      .withState(storeState)
      .provide({
        call(effect, next) {
          if (effect.fn === getAccessToken) {
            return undefined;
          }
          return next();
        },
      })
      .run();

    const failure = effects.put
      ?.map((effect) => effect.payload.action)
      .find((action) => action.type === 'serviceReports/LOAD_REPORT_SECTION_FAILURE');

    expect(loaded).toBe(false);
    expect(failure).toEqual(
      loadReportSectionFailure(
        'pdf',
        'summary',
        'pdf|last30Days|2026-08-12|2026-09-10',
        REPORT_SECTION_LOAD_ERROR
      )
    );
  });

  it('refreshes the token and retries when the loader returns 401', async () => {
    const tokens: string[] = [];
    registerSectionLoader('pdf', 'summary', async ({ token }) => {
      tokens.push(token);
      if (token === 'expired-token') {
        throw unauthorized();
      }
      return { pdfGenerated: 4 };
    });

    let accessCalls = 0;
    const { effects } = await expectSaga(loadReportSection, {
      type: 'serviceReports/LOAD_REPORT_SECTION',
      serviceId: 'pdf',
      sectionId: 'summary',
    })
      .withState(storeState)
      .provide({
        call(effect, next) {
          if (effect.fn === getAccessToken) {
            accessCalls += 1;
            return accessCalls === 1 ? 'expired-token' : 'fresh-token';
          }
          return next();
        },
      })
      .run();

    const success = effects.put
      ?.map((effect) => effect.payload.action)
      .find((action) => action.type === 'serviceReports/LOAD_REPORT_SECTION_SUCCESS');

    expect(tokens).toEqual(['expired-token', 'fresh-token']);
    expect(success).toEqual(
      loadReportSectionSuccess('pdf', 'summary', 'pdf|last30Days|2026-08-12|2026-09-10', { pdfGenerated: 4 })
    );
  });
});
