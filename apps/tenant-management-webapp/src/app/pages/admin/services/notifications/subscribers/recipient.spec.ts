import { getChannelAddress, isVerified, formatDate } from './recipient';

describe('getChannelAddress', () => {
  const subscriber = {
    id: 'subscriber-1',
    channels: [
      { channel: 'email', address: 'tester@test.co', verified: true },
      { channel: 'sms', address: '7801234567', verified: false },
    ],
  };

  it('returns the address of the channel asked for', () => {
    expect(getChannelAddress(subscriber, 'email')).toBe('tester@test.co');
    expect(getChannelAddress(subscriber, 'sms')).toBe('7801234567');
  });

  it('returns nothing for a channel the recipient cannot be reached at', () => {
    expect(getChannelAddress(subscriber, 'bot')).toBeUndefined();
  });

  it('returns nothing rather than failing for a recipient without channels', () => {
    expect(getChannelAddress({ id: 'subscriber-2' }, 'email')).toBeUndefined();
    expect(getChannelAddress(undefined, 'email')).toBeUndefined();
  });
});

describe('isVerified', () => {
  it('is verified when every address the recipient can be reached at is verified', () => {
    expect(
      isVerified({
        id: 'subscriber-1',
        channels: [
          { channel: 'email', address: 'tester@test.co', verified: true },
          { channel: 'sms', address: '7801234567', verified: true },
        ],
      }),
    ).toBe(true);
  });

  // An unverified address is one a notification may not arrive at, whichever channel holds it.
  it('is not verified when any address is unverified', () => {
    expect(
      isVerified({
        id: 'subscriber-1',
        channels: [
          { channel: 'email', address: 'tester@test.co', verified: true },
          { channel: 'sms', address: '7801234567', verified: false },
        ],
      }),
    ).toBe(false);
  });

  it('is not verified when the recipient has no address at all', () => {
    expect(isVerified({ id: 'subscriber-1', channels: [] })).toBe(false);
    expect(isVerified({ id: 'subscriber-1' })).toBe(false);
  });
});

describe('formatDate', () => {
  it('shows a dash when there is no date to show', () => {
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('')).toBe('—');
  });

  it('formats a date it is given', () => {
    const formatted = formatDate('2026-01-02T18:00:00.000Z');
    expect(formatted).not.toBe('—');
    expect(formatted).toContain('2026');
  });
});
