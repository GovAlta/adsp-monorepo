import * as timekeeper from 'timekeeper';

import { getBeforeLastAccessed } from './deleteOldFiles';

describe('Delete old files', () => {
  it('can return correct before last accessed date', () => {
    timekeeper.freeze(new Date('2023-07-01T00:00:00.000Z'));

    const Day30Before1 = getBeforeLastAccessed(30);
    expect(Day30Before1).toBe('2023-06-01T00:00:00.000Z');
    timekeeper.reset();

    timekeeper.freeze(new Date('2023-07-01T18:00:00.000Z'));
    const Day30Before2 = getBeforeLastAccessed(30);
    // Test whether we can set the time to last middle night.
    expect(Day30Before2).toBe('2023-06-01T00:00:00.000Z');

    // Test retention period with float format. This is only for test purpose. Not expect to have non integer retention period
    const Day40Before = getBeforeLastAccessed(40.5);
    expect(Day40Before).toBe('2023-05-22T00:00:00.000Z');
    timekeeper.reset();
  });
});
