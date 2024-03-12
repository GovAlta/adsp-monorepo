import { getTimeFromGMT } from './timeUtil';

describe('getTimeFromGMT', () => {
  it('should format the time correctly for times with double-digit hours and minutes', () => {
    const date = new Date('2022-06-16T15:30:00Z'); // 15:30 in GMT
    const time = getTimeFromGMT(date);
    expect(time).toBe('15:30');
  });

  it('should pad single-digit hours and minutes with leading zeros', () => {
    const date = new Date('2022-06-16T09:05:00Z'); // 09:05 in GMT
    const time = getTimeFromGMT(date);

    expect(time).toBe('09:05');
  });
});
