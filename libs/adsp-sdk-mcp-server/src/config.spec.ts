import { readConfig, readHostedConfig } from './config';

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

  describe('hosted sign-in settings', () => {
    const AUTH_ENV = {
      MCP_PUBLIC_URL: 'https://mcp.example.test/',
      ADSP_ACCESS_SERVICE_URL: 'https://access.example.test',
      ADSP_DIRECTORY_SERVICE_URL: 'https://directory.example.test/',
    };

    it('leaves auth unset when none of the three is set', () => {
      expect(readHostedConfig({}).auth).toBeUndefined();
    });

    it('is not read by readConfig, so stdio users can keep the adsp-cli URL overrides', () => {
      const adspCliOverrides = {
        ADSP_ACCESS_SERVICE_URL: 'http://access.internal.example',
        ADSP_DIRECTORY_SERVICE_URL: 'https://directory.override.example.com',
      };

      expect(() => readConfig(adspCliOverrides)).not.toThrow();
      expect(readConfig({ ...adspCliOverrides, MCP_PUBLIC_URL: 'https://mcp.example.test' }).auth).toBeUndefined();
    });

    it('keeps the shared settings', () => {
      expect(readHostedConfig({ ...AUTH_ENV, MCP_MAX_IN_FLIGHT: '7' }).maxInFlight).toBe(7);
    });

    it('reads and normalises all three', () => {
      expect(readHostedConfig(AUTH_ENV).auth).toEqual({
        publicUrl: 'https://mcp.example.test',
        accessServiceUrl: 'https://access.example.test',
        directoryServiceUrl: 'https://directory.example.test',
      });
    });

    it('names the settings that are missing when only some are set', () => {
      expect(() => readHostedConfig({ MCP_PUBLIC_URL: AUTH_ENV.MCP_PUBLIC_URL })).toThrow(
        /ADSP_ACCESS_SERVICE_URL.*ADSP_DIRECTORY_SERVICE_URL/
      );
    });

    it.each(['http://access.example.test', 'not a url', 'ftp://access.example.test'])(
      'rejects %p as an access service URL',
      (value) => {
        expect(() => readHostedConfig({ ...AUTH_ENV, ADSP_ACCESS_SERVICE_URL: value })).toThrow(/ADSP_ACCESS_SERVICE_URL/);
      }
    );

    it.each(['http://127.0.0.1:4321', 'http://localhost:4321'])('allows plain http on loopback (%p)', (value) => {
      expect(readHostedConfig({ ...AUTH_ENV, MCP_PUBLIC_URL: value }).auth?.publicUrl).toBe(value);
    });
  });
});

