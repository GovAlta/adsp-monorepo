import { setTimeString, toInputDate } from './intakeDate';

jest.mock(
  '@lib/timeUtil',
  () => jest.requireActual('../../../../../apps/tenant-management-webapp/src/app/lib/timeUtil'),
  { virtual: true },
);

describe('setTimeString', () => {
  it('keeps the picked day and time from a date input', () => {
    const result = new Date(setTimeString('2026-11-20', '09:15:30'));

    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(10);
    expect(result.getDate()).toBe(20);
    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(15);
    expect(result.getSeconds()).toBe(30);
  });

  it('keeps the day of an unchanged saved date when only the time changes', () => {
    const saved = new Date(2026, 10, 20, 23, 0, 0).toISOString();
    const result = new Date(setTimeString(saved, '23:30:00'));

    expect(result.getDate()).toBe(20);
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(30);
  });

  it('round trips a saved value back to the same date and time', () => {
    const saved = setTimeString('2026-01-01', '00:00:00');
    const again = setTimeString(saved, new Date(saved).toTimeString().split(' ')[0]);

    expect(again).toBe(saved);
  });
});

describe('toInputDate', () => {
  it('shows the local day of a saved value', () => {
    expect(toInputDate(new Date(2026, 10, 20, 23, 30).toISOString())).toBe('2026-11-20');
  });

  it('defaults to today when there is no value', () => {
    expect(toInputDate()).toBe(toInputDate(new Date().toISOString()));
  });
});
