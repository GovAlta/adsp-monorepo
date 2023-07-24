import * as timekeeper from 'timekeeper';

import { getBeforeLastAccessed } from './deleteOldFiles';

describe('Delete old files', () => {
  it('can return correct before last accessed date', () => {
    timekeeper.freeze(new Date('2023-07-01T06:00:00.000Z'));

    const Day30Before1 = getBeforeLastAccessed(30);
    expect(Day30Before1).toBe('2023-06-01T06:00:00.000Z');
    timekeeper.reset();

    timekeeper.freeze(new Date('2023-07-01T18:00:00.000Z'));
    const Day30Before2 = getBeforeLastAccessed(30);
    // Test reset to last middle night.
    expect(Day30Before2).toBe('2023-06-01T06:00:00.000Z');

    // Test float retention period. This is only for test purpose. Not expect to have non integer retention period
    const Day40Before = getBeforeLastAccessed(40.5);
    expect(Day40Before).toBe('2023-05-22T06:00:00.000Z');
    timekeeper.reset();
  });
});
