import { mkdtempSync, rmSync } from 'fs';
import * as os from 'os';
import { join } from 'path';
import { getConfigFilePath, readConfig, writeConfig } from './config';

describe('config', () => {
  let tempHome: string;
  let homedirSpy: jest.SpyInstance;

  beforeEach(() => {
    tempHome = mkdtempSync(join(os.tmpdir(), 'adsp-cli-config-test-'));
    homedirSpy = jest.spyOn(os, 'homedir').mockReturnValue(tempHome);
  });

  afterEach(() => {
    homedirSpy.mockRestore();
    rmSync(tempHome, { recursive: true, force: true });
  });

  it('getConfigFilePath resolves under the (mocked) home directory', () => {
    expect(getConfigFilePath()).toBe(join(tempHome, '.adsp-cli', 'config.json'));
  });

  it('returns null when no config has been written', () => {
    expect(readConfig()).toBeNull();
  });

  it('round-trips a written config', () => {
    writeConfig({ tenantRealm: 'my-realm' });

    expect(readConfig()).toEqual({ tenantRealm: 'my-realm' });
  });

  it('overwrites a previously written config', () => {
    writeConfig({ tenantRealm: 'first-realm' });
    writeConfig({ tenantRealm: 'second-realm' });

    expect(readConfig()).toEqual({ tenantRealm: 'second-realm' });
  });
});
