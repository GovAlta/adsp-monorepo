import { expectSaga } from 'redux-saga-test-plan';
import axios from 'axios';
import { getAccessToken } from '../tenant/sagas';
import { downloadFile } from './export';
import {
  exportAuditEvents,
  fetchAuditConfiguration,
  fetchAuditEvents,
  mapAuditConfiguration,
  toCatalogs,
} from './sagas';
import {
  FETCH_AUDIT_CONFIGURATION_SUCCESS_ACTION,
  FETCH_AUDIT_EVENTS_SUCCESS_ACTION,
  exportAuditEvents as exportAuditEventsAction,
  fetchAuditEvents as fetchAuditEventsAction,
} from './actions';

const baseUrl = 'http://mock-config-service.com';
const catalog = (actions: Record<string, unknown>) => ({ latest: { configuration: { actions } } });

describe('audit sagas', () => {
  it('maps the catalog listing, sorted, with the core flag', () => {
    const catalogs = toCatalogs([
      { application: 'form-app', core: false, actions: [{ name: 'submit' }, { name: 'create' }] as never },
      { application: 'audit-service', core: true, actions: [] },
    ]);

    expect(catalogs.map((c) => [c.application, c.isCore])).toEqual([
      ['audit-service', true],
      ['form-app', false],
    ]);
    expect(catalogs[1].actions.map((a) => a.name)).toEqual(['create', 'submit']);
  });

  it('maps retention documents', () => {
    const { retention } = mapAuditConfiguration([
      { name: 'actions-form-app', ...catalog({ submit: {} }) },
      { name: 'retention', latest: { configuration: { classes: { standard: { days: 30 } } } } },
      { name: 'retention-form-app', latest: { configuration: { classes: { security: { days: 400 } } } } },
    ]);

    expect(retention).toEqual({
      tenant: { standard: { days: 30 } },
      applications: { 'form-app': { security: { days: 400 } } },
    });
  });

  it('loads one page of audit events from the namespace route using the page size and cursor', async () => {
    const calls = [];
    const { effects } = await expectSaga(
      fetchAuditEvents,
      fetchAuditEventsAction({ namespace: 'form-app', status: 'failure' }, 'cursor', 25),
    )
      .withState({ config: { serviceUrls: { auditServiceApiUrl: baseUrl } } })
      .provide({
        call(effect, next) {
          if (effect.fn === getAccessToken) {
            return 'token';
          }
          if (effect.fn === axios.get) {
            calls.push(effect.args[0]);
            return { data: { results: [{ id: '1' }], page: { next: 'n2' } } };
          }
          return next();
        },
      })
      .run();

    expect(calls).toEqual([`${baseUrl}/audit/v1/form-app/events?top=25&status=failure&after=cursor`]);
    const success = effects.put.map((e) => e.payload.action).find((a) => a.type === FETCH_AUDIT_EVENTS_SUCCESS_ACTION);
    expect(success).toMatchObject({ next: 'n2', append: false });
  });

  it('downloads the CSV built by the server from the export route', async () => {
    const urls = [];
    const downloads = [];
    const { effects } = await expectSaga(exportAuditEvents, exportAuditEventsAction({ status: 'failure' }))
      .withState({ config: { serviceUrls: { auditServiceApiUrl: baseUrl } } })
      .provide({
        call(effect, next) {
          if (effect.fn === getAccessToken) {
            return 'token';
          }
          if (effect.fn === axios.get) {
            urls.push(effect.args[0]);
            return { data: 'csv-body' };
          }
          if (effect.fn === downloadFile) {
            downloads.push(effect.args);
            return undefined;
          }
          return next();
        },
      })
      .run();

    expect(urls).toEqual([`${baseUrl}/audit/v1/events/export?status=failure`]);
    expect(downloads).toHaveLength(1);
    expect(downloads[0][1]).toBe('csv-body');
    expect(downloads[0][2]).toBe('text/csv');
    expect(effects.put.map((e) => e.payload.action.type)).toEqual([
      'notifications/success',
      'audit/EXPORT_AUDIT_EVENTS_DONE_ACTION',
    ]);
  });

  it('reports a failed export and still finishes', async () => {
    const { effects } = await expectSaga(exportAuditEvents, exportAuditEventsAction({}))
      .withState({ config: { serviceUrls: { auditServiceApiUrl: baseUrl } } })
      .provide({
        call(effect, next) {
          if (effect.fn === getAccessToken) {
            return 'token';
          }
          if (effect.fn === axios.get) {
            throw new Error('boom');
          }
          return next();
        },
      })
      .run();

    expect(effects.put.map((e) => e.payload.action.type)).toEqual([
      'notifications/error',
      'audit/EXPORT_AUDIT_EVENTS_DONE_ACTION',
    ]);
  });

  it('loads catalogs from the audit service and retention from the configuration listing', async () => {
    const urls = [];
    const { effects } = await expectSaga(fetchAuditConfiguration)
      .withState({
        config: { serviceUrls: { configurationServiceApiUrl: baseUrl, auditServiceApiUrl: 'http://mock-audit.com' } },
      })
      .provide({
        call(effect, next) {
          if (effect.fn === getAccessToken) {
            return 'token';
          }
          if (effect.fn === axios.get) {
            urls.push(effect.args[0]);
            return effect.args[0].endsWith('/namespaces')
              ? { data: { results: ['form-app'] } }
              : { data: [{ application: 'form-app', core: true, actions: [{ name: 'submit' }] }] };
          }
          if (effect.fn.name === 'fetchAll') {
            return [{ name: 'retention', latest: { configuration: { classes: { standard: { days: 30 } } } } }];
          }
          return next();
        },
      })
      .run();

    expect(urls).toEqual(['http://mock-audit.com/audit/v1/actions', 'http://mock-audit.com/audit/v1/namespaces']);
    const success = effects.put
      .map((e) => e.payload.action)
      .find((a) => a.type === FETCH_AUDIT_CONFIGURATION_SUCCESS_ACTION);
    expect(success.catalogs).toMatchObject([{ application: 'form-app', isCore: true }]);
    expect(success.namespaces).toEqual(['form-app']);
    expect(success.retention.tenant).toEqual({ standard: { days: 30 } });
  });
});
