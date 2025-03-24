import { to12HourFormat, UTCToFullLocalTime } from './dateUtils';

describe('Test date utils', () => {
  it('can convert ISO string', () => {
    expect(UTCToFullLocalTime('2025-03-21T17:31:29.961Z')).toBe('2025-03-21, 11:31:29 AM');
  });
  it('can convert time string', () => {
    expect(to12HourFormat('13:30:01')).toBe('01:30:01 PM');
    expect(to12HourFormat('08:30:00')).toBe('08:30:00 AM');
  });
});
