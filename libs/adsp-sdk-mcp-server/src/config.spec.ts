import { readConfig } from './config';

describe('readConfig', () => {
  it('uses the defaults when nothing is set', () => {
    expect(readConfig({})).toEqual({
      maxInFlight: 64,
      inFlightWaitMs: 1000,
      rateLimitPerMinute: 1200,
      liveToolMaxConcurrent: 8,
      trustedProxy: 'uniquelocal',
      corsOrigins: [],
      shutdownDelayMs: 5000,
      shutdownTimeoutMs: 30000,
    });
  });

  it('treats empty values as unset', () => {
    expect(readConfig({ MCP_MAX_IN_FLIGHT: '', MCP_RATE_LIMIT_PER_MINUTE: ' ', CORS_ORIGIN: '' })).toEqual(
      readConfig({})
    );
  });

  it('parses each variable', () => {
    expect(
      readConfig({
        MCP_MAX_IN_FLIGHT: '10',
        MCP_IN_FLIGHT_WAIT_MS: ' 250 ',
        MCP_RATE_LIMIT_PER_MINUTE: '30',
        MCP_LIVE_TOOL_MAX_CONCURRENT: '2',
        TRUSTED_PROXY: 'loopback',
        CORS_ORIGIN: 'https://a.test',
      })
    ).toEqual({
      maxInFlight: 10,
      inFlightWaitMs: 250,
      rateLimitPerMinute: 30,
      liveToolMaxConcurrent: 2,
      trustedProxy: 'loopback',
      corsOrigins: ['https://a.test'],
      shutdownDelayMs: 5000,
      shutdownTimeoutMs: 30000,
    });
  });

  it.each(['abc', '1.5', '-1', '10ms'])('rejects a non-integer MCP_MAX_IN_FLIGHT of %p', (value) => {
    expect(() => readConfig({ MCP_MAX_IN_FLIGHT: value })).toThrow(/MCP_MAX_IN_FLIGHT/);
  });

  it.each(['MCP_MAX_IN_FLIGHT', 'MCP_LIVE_TOOL_MAX_CONCURRENT'])('rejects 0 for %s', (name) => {
    expect(() => readConfig({ [name]: '0' })).toThrow(new RegExp(name));
  });

  it('accepts 0 for MCP_RATE_LIMIT_PER_MINUTE and MCP_IN_FLIGHT_WAIT_MS', () => {
    expect(readConfig({ MCP_RATE_LIMIT_PER_MINUTE: '0', MCP_IN_FLIGHT_WAIT_MS: '0' })).toMatchObject({
      rateLimitPerMinute: 0,
      inFlightWaitMs: 0,
    });
  });

  it('normalises CORS_ORIGIN entries', () => {
    expect(readConfig({ CORS_ORIGIN: ' https://a.test/ ,https://b.test:8443,, ' }).corsOrigins).toEqual([
      'https://a.test',
      'https://b.test:8443',
    ]);
  });

  it('treats CORS_ORIGIN=* as allow-all', () => {
    expect(readConfig({ CORS_ORIGIN: ' * ' }).corsOrigins).toBe('*');
  });

  it('rejects * mixed with origins', () => {
    expect(() => readConfig({ CORS_ORIGIN: '*,https://a.test' })).toThrow(/CORS_ORIGIN/);
  });

  it.each([
    ['true', true],
    ['false', false],
    ['2', 2],
    ['10.0.0.0/8, loopback', '10.0.0.0/8, loopback'],
  ])('parses TRUSTED_PROXY %p', (value, expected) => {
    expect(readConfig({ TRUSTED_PROXY: value }).trustedProxy).toEqual(expected);
  });

  it('parses the shutdown delay and timeout', () => {
    expect(readConfig({ MCP_SHUTDOWN_DELAY_MS: '0', MCP_SHUTDOWN_TIMEOUT_MS: '45000' })).toMatchObject({
      shutdownDelayMs: 0,
      shutdownTimeoutMs: 45000,
    });
  });

  it('rejects a shutdown delay that is not shorter than the timeout', () => {
    expect(() => readConfig({ MCP_SHUTDOWN_DELAY_MS: '30000', MCP_SHUTDOWN_TIMEOUT_MS: '30000' })).toThrow(
      /MCP_SHUTDOWN_DELAY_MS/
    );
  });
});
