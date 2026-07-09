import { mkdtempSync, rmSync } from 'fs';
import * as os from 'os';
import { join } from 'path';
import { resolveEnvironmentName, resolveEnvironmentUrls, resolveTenantRealm } from './environments';
import { writeConfig } from './config';

describe('resolveEnvironmentName', () => {
  let tempHome: string;

  beforeEach(() => {
    tempHome = mkdtempSync(join(os.tmpdir(), 'adsp-cli-env-test-'));
    jest.spyOn(os, 'homedir').mockReturnValue(tempHome);
    delete process.env.ADSP_ENV;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    rmSync(tempHome, { recursive: true, force: true });
    delete process.env.ADSP_ENV;
  });

  it('defaults to prod when nothing is set', () => {
    expect(resolveEnvironmentName()).toBe('prod');
  });

  it('resolves from ADSP_ENV when set to a recognized value', () => {
    process.env.ADSP_ENV = 'dev';

    expect(resolveEnvironmentName()).toBe('dev');
  });

  it('falls back to prod when ADSP_ENV is set to an unrecognized value', () => {
    process.env.ADSP_ENV = 'staging';

    expect(resolveEnvironmentName()).toBe('prod');
  });

  it('falls back to the persisted config when ADSP_ENV is unset', () => {
    writeConfig({ tenantRealm: 'my-realm', env: 'test' });

    expect(resolveEnvironmentName()).toBe('test');
  });

  it('prefers ADSP_ENV over a persisted config env', () => {
    writeConfig({ tenantRealm: 'my-realm', env: 'test' });
    process.env.ADSP_ENV = 'dev';

    expect(resolveEnvironmentName()).toBe('dev');
  });

  it('prefers an explicit override over ADSP_ENV and persisted config', () => {
    writeConfig({ tenantRealm: 'my-realm', env: 'test' });
    process.env.ADSP_ENV = 'dev';

    expect(resolveEnvironmentName('prod')).toBe('prod');
  });
});

describe('resolveEnvironmentUrls', () => {
  let tempHome: string;

  beforeEach(() => {
    tempHome = mkdtempSync(join(os.tmpdir(), 'adsp-cli-env-test-'));
    jest.spyOn(os, 'homedir').mockReturnValue(tempHome);
    delete process.env.ADSP_ENV;
    delete process.env.ADSP_ACCESS_SERVICE_URL;
    delete process.env.ADSP_DIRECTORY_SERVICE_URL;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    rmSync(tempHome, { recursive: true, force: true });
    delete process.env.ADSP_ENV;
    delete process.env.ADSP_ACCESS_SERVICE_URL;
    delete process.env.ADSP_DIRECTORY_SERVICE_URL;
  });

  it('resolves the dev preset for an explicit env override', () => {
    expect(resolveEnvironmentUrls('dev')).toEqual({
      accessServiceUrl: 'https://access.adsp-dev.gov.ab.ca',
      directoryServiceUrl: 'https://directory-service.adsp-dev.gov.ab.ca',
    });
  });

  it('individually overrides accessServiceUrl/directoryServiceUrl regardless of the resolved environment', () => {
    process.env.ADSP_ACCESS_SERVICE_URL = 'https://access.override.example.com';
    process.env.ADSP_DIRECTORY_SERVICE_URL = 'https://directory.override.example.com';

    expect(resolveEnvironmentUrls('dev')).toEqual({
      accessServiceUrl: 'https://access.override.example.com',
      directoryServiceUrl: 'https://directory.override.example.com',
    });
  });
});

describe('resolveTenantRealm', () => {
  let tempHome: string;

  beforeEach(() => {
    tempHome = mkdtempSync(join(os.tmpdir(), 'adsp-cli-env-test-'));
    jest.spyOn(os, 'homedir').mockReturnValue(tempHome);
    delete process.env.ADSP_TENANT_REALM;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    rmSync(tempHome, { recursive: true, force: true });
    delete process.env.ADSP_TENANT_REALM;
  });

  it('resolves from the ADSP_TENANT_REALM env var when set', () => {
    process.env.ADSP_TENANT_REALM = 'env-realm';

    expect(resolveTenantRealm()).toEqual({ ok: true, tenantRealm: 'env-realm' });
  });

  it('falls back to the persisted config when the env var is unset', () => {
    writeConfig({ tenantRealm: 'persisted-realm' });

    expect(resolveTenantRealm()).toEqual({ ok: true, tenantRealm: 'persisted-realm' });
  });

  it('prefers the env var over a persisted config realm', () => {
    writeConfig({ tenantRealm: 'persisted-realm' });
    process.env.ADSP_TENANT_REALM = 'env-realm';

    expect(resolveTenantRealm()).toEqual({ ok: true, tenantRealm: 'env-realm' });
  });

  it('returns not-ok naming ADSP_TENANT_REALM when neither is set', () => {
    expect(resolveTenantRealm()).toEqual({ ok: false, missingEnvVar: 'ADSP_TENANT_REALM' });
  });
});
