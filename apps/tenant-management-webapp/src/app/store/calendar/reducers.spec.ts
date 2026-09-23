import reducer from './reducers';
import { DeleteCalendarSuccess, fetchCalendarSuccess, UpdateCalendarSuccess } from './actions';
import { CALENDAR_INIT, CalendarItem, CalendarService } from './models';

const tenantCalendar: CalendarItem = {
  name: 'shared',
  displayName: 'Tenant calendar',
  readRoles: [],
  updateRoles: [],
  selectedCalendarEvents: [{ id: 1, name: 'event', start: '', end: '', isPublic: false }],
};

const coreCalendar: CalendarItem = { ...tenantCalendar, displayName: 'Core calendar' };

const state: CalendarService = {
  ...CALENDAR_INIT,
  calendars: { shared: tenantCalendar, other: { ...tenantCalendar, name: 'other' } },
  coreCalendars: { shared: coreCalendar },
};

describe('calendar definition reducer', () => {
  it('keeps tenant and core calendars separate when their names overlap', () => {
    const result = reducer(
      CALENDAR_INIT,
      fetchCalendarSuccess({ tenant: { shared: tenantCalendar }, core: { shared: coreCalendar } })
    );

    expect(result.calendars.shared).toEqual(tenantCalendar);
    expect(result.coreCalendars.shared).toEqual(coreCalendar);
  });

  it('updates one tenant definition without losing other calendars or loaded events', () => {
    const updated: CalendarItem = {
      name: 'shared',
      displayName: 'Updated calendar',
      readRoles: [],
      updateRoles: [],
    };
    const result = reducer(state, UpdateCalendarSuccess(updated));

    expect(result.calendars.shared.displayName).toBe('Updated calendar');
    expect(result.calendars.shared.selectedCalendarEvents).toEqual(tenantCalendar.selectedCalendarEvents);
    expect(result.calendars.other).toEqual(state.calendars.other);
    expect(result.coreCalendars.shared).toEqual(coreCalendar);
  });

  it('deletes only the tenant definition without mutating the previous state or core calendar', () => {
    const result = reducer(state, DeleteCalendarSuccess('shared'));

    expect(result.calendars.shared).toBeUndefined();
    expect(result.calendars.other).toEqual(state.calendars.other);
    expect(result.coreCalendars.shared).toEqual(coreCalendar);
    expect(state.calendars.shared).toEqual(tenantCalendar);
  });
});
