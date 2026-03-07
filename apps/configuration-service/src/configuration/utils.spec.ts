import type { Logger } from 'winston';
import { calculateConfigurationSize } from './utils';

describe('calculateConfigurationSize', () => {
  const loggerMock = {
    debug: jest.fn(),
  } as unknown as Logger;

  beforeEach(() => {
    loggerMock.debug = jest.fn();
  });

  it('returns byte size for valid configuration', () => {
    const configuration = { key: 'value' };

    const size = calculateConfigurationSize(loggerMock, 'platform', 'test-service', configuration);

    expect(size).toBe(Buffer.byteLength(JSON.stringify(configuration), 'utf8'));
  });

  it('returns size for undefined configuration using empty object fallback', () => {
    const size = calculateConfigurationSize(loggerMock, 'platform', 'test-service', undefined);

    expect(size).toBe(Buffer.byteLength(JSON.stringify({}), 'utf8'));
  });

  it('returns undefined and logs debug when serialization fails', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    const size = calculateConfigurationSize(loggerMock, 'platform', 'test-service', circular);

    expect(size).toBeUndefined();
    expect(loggerMock.debug).toHaveBeenCalledWith(
      expect.stringContaining('Failed to calculate configuration size for platform:test-service:')
    );
  });
});
