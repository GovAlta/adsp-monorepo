import { expectSaga } from 'redux-saga-test-plan';
import { getAccessToken } from '@store/tenant/sagas';
import { registerSectionLoader, resetSectionLoaders } from '@pages/admin/reports/registry/serviceReportRegistry';
import { loadReportSectionFailure, loadReportSectionSuccess } from './actions';
import { loadReportSection } from './sagas';

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
        'Error: gateway unavailable'
      )
    );
  });
});
