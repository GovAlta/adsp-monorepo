import reducer from './reducers';
import {
  clearAuditEvents,
  exportAuditEvents,
  exportAuditEventsDone,
  fetchAuditConfigurationSuccess,
  fetchAuditEvents,
  fetchAuditEventsFailed,
  fetchAuditEventsSuccess,
} from './actions';
import { defaultAuditState } from './models';
import type { AuditEventRecord } from './models';

const event = (id: string) => ({ id, namespace: 'form-app', action: 'submit' }) as AuditEventRecord;

describe('audit reducer', () => {
  it('stores catalogs and retention and marks them loaded', () => {
    const catalogs = [{ application: 'form-app', isCore: false, actions: [] }];
    const retention = { tenant: { standard: { days: 30 } }, applications: {} };
    const state = reducer(defaultAuditState, fetchAuditConfigurationSuccess(catalogs, retention));
    expect(state).toMatchObject({ catalogs, retention, loaded: true });
  });

  it('replaces events on a new search and appends when paging', () => {
    let state = reducer(defaultAuditState, fetchAuditEvents({}));
    expect(state.events.loading).toBe(true);

    state = reducer(state, fetchAuditEventsSuccess([event('1')], 'cursor', false));
    expect(state.events).toEqual({ results: [event('1')], next: 'cursor', loading: false });

    state = reducer(state, fetchAuditEventsSuccess([event('2')], undefined, true));
    expect(state.events.results.map((e) => e.id)).toEqual(['1', '2']);
    expect(state.events.next).toBeUndefined();

    state = reducer(state, fetchAuditEventsSuccess([event('3')], undefined, false));
    expect(state.events.results.map((e) => e.id)).toEqual(['3']);
  });

  it('tracks whether an export is running', () => {
    let state = reducer(defaultAuditState, exportAuditEvents({}));
    expect(state.exporting).toBe(true);
    state = reducer(state, exportAuditEventsDone());
    expect(state.exporting).toBe(false);
  });

  it('stops loading on failure and resets events on clear', () => {
    let state = reducer(defaultAuditState, fetchAuditEvents({}));
    state = reducer(state, fetchAuditEventsFailed());
    expect(state.events.loading).toBe(false);

    state = reducer(reducer(state, fetchAuditEventsSuccess([event('1')], 'c', false)), clearAuditEvents());
    expect(state.events).toEqual(defaultAuditState.events);
  });
});
