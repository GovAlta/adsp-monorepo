import { mkdtempSync, rmSync } from 'fs';
import * as os from 'os';
import { join } from 'path';
import { getDirectoryServiceUrl, getServiceUrls } from './directory';
import { HttpRequestError } from './httpError';

const ENV_KEYS = ['ADSP_ENV', 'ADSP_TENANT_REALM', 'ADSP_ACCESS_SERVICE_URL', 'ADSP_DIRECTORY_SERVICE_URL'] as const;
let originalEnv: Record<string, string | undefined>;
let tempHome: string;

beforeEach(() => {
  originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  ENV_KEYS.forEach((key) => delete process.env[key]);
  // resolveEnvironmentName() falls back to ~/.adsp-cli/config.json's persisted env when ADSP_ENV is
  // unset — isolate os.homedir() so this suite never reads a real, developer-machine config file.
  tempHome = mkdtempSync(join(os.tmpdir(), 'adsp-cli-directory-test-'));
  jest.spyOn(os, 'homedir').mockReturnValue(tempHome);
});

afterEach(() => {
  ENV_KEYS.forEach((key) => {
    if (originalEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalEnv[key];
    }
  });
  jest.restoreAllMocks();
  rmSync(tempHome, { recursive: true, force: true });
});

describe('getDirectoryServiceUrl', () => {
  it('resolves the default prod directory URL even without ADSP_TENANT_REALM set', () => {
    // Directory URL resolution is independent of the tenant realm — this must keep working
    // for a caller using the ADSP_ACCESS_TOKEN escape hatch, which never sets a realm at all.
    expect(getDirectoryServiceUrl()).toBe('https://directory-service.adsp.alberta.ca');
  });

  it('resolves the dev preset when ADSP_ENV=dev', () => {
    process.env.ADSP_ENV = 'dev';
    expect(getDirectoryServiceUrl()).toBe('https://directory-service.adsp-dev.gov.ab.ca');
  });

  it('respects an explicit ADSP_DIRECTORY_SERVICE_URL override', () => {
    process.env.ADSP_DIRECTORY_SERVICE_URL = 'https://directory.local.test';
    expect(getDirectoryServiceUrl()).toBe('https://directory.local.test');
  });
});

describe('getServiceUrls', () => {
  it('reduces directory entries into a urn-to-url map', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { urn: 'urn:ads:platform:event-service', url: 'https://event-service.example.com' },
        { urn: 'urn:ads:platform:configuration-service', url: 'https://configuration-service.example.com' },
      ],
    }) as never;

    const urls = await getServiceUrls('https://directory-service.example.com');

    expect(urls).toEqual({
      'urn:ads:platform:event-service': 'https://event-service.example.com',
      'urn:ads:platform:configuration-service': 'https://configuration-service.example.com',
    });
  });

  it('throws an HttpRequestError carrying the status on a non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 }) as never;

    await expect(getServiceUrls('https://directory-service.example.com')).rejects.toMatchObject({
      status: 503,
    });
    await expect(getServiceUrls('https://directory-service.example.com')).rejects.toBeInstanceOf(HttpRequestError);
  });
});
