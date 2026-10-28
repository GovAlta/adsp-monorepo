import { expectSaga } from 'redux-saga-test-plan';
import axios from 'axios';
import { getAccessToken } from '../tenant/sagas';
import { downloadFile } from './export';
import { exportAuditEvents, fetchAuditConfiguration, fetchAuditEvents, mapAuditConfiguration } from './sagas';
import {
  FETCH_AUDIT_CONFIGURATION_SUCCESS_ACTION,
  FETCH_AUDIT_EVENTS_SUCCESS_ACTION,
  exportAuditEvents as exportAuditEventsAction,
  fetchAuditEvents as fetchAuditEventsAction,
} from './actions';

const baseUrl = 'http://mock-config-service.com';
const catalog = (actions: Record<string, unknown>) => ({ latest: { configuration: { actions } } });

describe('audit sagas', () => {
  it('maps catalogs and retention documents', () => {
    const { catalogs, retention } = mapAuditConfiguration(
      [
        { name: 'actions-form-app', ...catalog({ submit: { category: 'data' }, create: { category: 'data' } }) },
        { name: 'retention', latest: { configuration: { classes: { standard: { days: 30 } } } } },
        { name: 'retention-form-app', latest: { configuration: { classes: { security: { days: 400 } } } } },
      ],
      { actions: { 'event-read': { category: 'access' } } },
    );

    expect(catalogs.map((c) => [c.application, c.isCore])).toEqual([
      ['audit-service', true],
      ['form-app', false],
    ]);
    expect(catalogs[1].actions.map((a) => a.name)).toEqual(['create', 'submit']);
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

  it('loads tenant documents and tolerates a missing core catalog', async () => {
    const { effects } = await expectSaga(fetchAuditConfiguration)
      .withState({ config: { serviceUrls: { configurationServiceApiUrl: baseUrl } } })
      .provide({
        call(effect, next) {
          if (effect.fn === getAccessToken) {
            return 'token';
          }
          if (effect.fn === axios.get) {
            throw new Error('not found');
          }
          if (effect.fn.name === 'fetchAll') {
            return [{ name: 'actions-form-app', ...catalog({ submit: {} }) }];
          }
          return next();
        },
      })
      .run();

    const success = effects.put
      .map((e) => e.payload.action)
      .find((a) => a.type === FETCH_AUDIT_CONFIGURATION_SUCCESS_ACTION);
    expect(success.catalogs).toHaveLength(1);
  });
});
