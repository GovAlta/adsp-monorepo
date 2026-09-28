import axios from 'axios';
import { expectSaga } from 'redux-saga-test-plan';
import { getAccessToken } from '../tenant/sagas';
import { ERROR_NOTIFICATION } from '../notifications/actions';
import {
  DeleteCalendar,
  DeleteCalendarSuccess,
  FETCH_CALENDARS_SUCCESS_ACTION,
  fetchCalendarSuccess,
  fetchCalendars,
  UpdateCalendar,
  UpdateCalendarSuccess,
  UPDATE_CALENDAR_SUCCESS_ACTION,
} from './actions';
import { fetchCalendarApi, partitionCalendars } from './api';
import { CalendarDefinition } from './models';
import { deleteCalendar, fetchCalendars as fetchCalendarsSaga, updateCalendar } from './sagas';

const calendarServiceUrl = 'https://calendar-service.example';
const state = {
  config: { serviceUrls: { calendarServiceApiUrl: calendarServiceUrl } },
};

const tenantCalendar: CalendarDefinition = {
  urn: 'urn:ads:platform:calendar-service:v1:/calendars/team',
  name: 'team',
  displayName: 'Team',
  description: 'Team calendar',
  readRoles: [],
  updateRoles: ['editor'],
  source: 'tenant',
};

const coreCalendar: CalendarDefinition = {
  ...tenantCalendar,
  displayName: 'Core team',
  source: 'core',
};

describe('calendar definition sagas', () => {
  it('retains a definition whose valid name is also an object property name', () => {
    const definitions = partitionCalendars([{ ...tenantCalendar, name: 'constructor' }]);

    expect(Object.hasOwn(definitions.tenant, 'constructor')).toBe(true);
  });

  it('rejects definitions missing the calendar-service URN', () => {
    expect(() => partitionCalendars([{ ...tenantCalendar, urn: undefined }])).toThrow(
      'Calendar service returned an invalid definition.'
    );
  });

  it('fetches tenant and core definitions from the calendar service, including duplicate names', async () => {
    await expectSaga(fetchCalendarsSaga, fetchCalendars())
      .withState(state)
      .provide({
        call(effect, next) {
          if (effect.fn === getAccessToken) {
            return 'test-token';
          }
          if (effect.fn === fetchCalendarApi) {
            expect(effect.args).toEqual(['test-token', `${calendarServiceUrl}/calendar/v1/calendars`]);
            return [tenantCalendar, coreCalendar];
          }
          return next();
        },
      })
      .put(fetchCalendarSuccess({ tenant: { team: tenantCalendar }, core: { team: coreCalendar } }))
      .run();
  });

  it('reports an invalid calendar-service list rather than treating it as an empty list', async () => {
    await expectSaga(fetchCalendarsSaga, fetchCalendars())
      .withState(state)
      .provide({
        call(effect, next) {
          if (effect.fn === getAccessToken) {
            return 'test-token';
          }
          if (effect.fn === fetchCalendarApi) {
            return [{ ...tenantCalendar, source: 'unexpected' }];
          }
          return next();
        },
      })
      .put.like({ action: { type: ERROR_NOTIFICATION } })
      .not.put.actionType(FETCH_CALENDARS_SUCCESS_ACTION)
      .run();
  });

  it('creates a definition without sending locally loaded events or response-only fields', async () => {
    const calendarWithEvents = {
      ...tenantCalendar,
      selectedCalendarEvents: [{ id: 1, name: 'event', start: '', end: '', isPublic: false }],
    };

    await expectSaga(updateCalendar, UpdateCalendar(calendarWithEvents, true))
      .withState(state)
      .provide({
        call(effect, next) {
          if (effect.fn === getAccessToken) {
            return 'test-token';
          }
          if (effect.fn === axios.post) {
            expect(effect.args[0]).toBe(`${calendarServiceUrl}/calendar/v1/calendars`);
            expect(effect.args[1]).toEqual({
              name: 'team',
              displayName: 'Team',
              description: 'Team calendar',
              readRoles: [],
              updateRoles: ['editor'],
            });
            return { data: tenantCalendar };
          }
          return next();
        },
      })
      .put(UpdateCalendarSuccess(tenantCalendar))
      .run();
  });

  it('updates a tenant definition at its encoded calendar URL', async () => {
    const updated = { ...tenantCalendar, name: 'team meeting' };

    await expectSaga(updateCalendar, UpdateCalendar(updated, false))
      .withState(state)
      .provide({
        call(effect, next) {
          if (effect.fn === getAccessToken) {
            return 'test-token';
          }
          if (effect.fn === axios.put) {
            expect(effect.args[0]).toBe(`${calendarServiceUrl}/calendar/v1/calendars/team%20meeting`);
            return { data: updated };
          }
          return next();
        },
      })
      .put(UpdateCalendarSuccess(updated))
      .run();
  });

  it('deletes one tenant definition through the calendar service', async () => {
    await expectSaga(deleteCalendar, DeleteCalendar('team meeting'))
      .withState(state)
      .provide({
        call(effect, next) {
          if (effect.fn === getAccessToken) {
            return 'test-token';
          }
          if (effect.fn === axios.delete) {
            expect(effect.args[0]).toBe(`${calendarServiceUrl}/calendar/v1/calendars/team%20meeting`);
            return { status: 204 };
          }
          return next();
        },
      })
      .put(DeleteCalendarSuccess('team meeting'))
      .run();
  });

  it('does not report success when a write fails', async () => {
    await expectSaga(updateCalendar, UpdateCalendar(tenantCalendar, true))
      .withState(state)
      .provide({
        call(effect, next) {
          if (effect.fn === getAccessToken) {
            return 'test-token';
          }
          if (effect.fn === axios.post) {
            throw new Error('Request rejected');
          }
          return next();
        },
      })
      .put.like({ action: { type: ERROR_NOTIFICATION } })
      .not.put.actionType(UPDATE_CALENDAR_SUCCESS_ACTION)
      .run();
  });
});
