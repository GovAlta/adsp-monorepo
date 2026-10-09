import * as envalid from 'envalid';

import { createEnvironment } from './environment';

describe('environment', () => {
  const valid = {
    CLIENT_SECRET: 'client-secret-value',
    STORE_SECRET: 'store-secret-value-123',
    SESSION_SECRET: 'session-secret-value-123',
    SECRET_SALT: 'secret-salt-value-123',
  };

  const onInvalid = jest.fn();

  beforeEach(() => {
    onInvalid.mockClear();
  });

  it('can create environment with secrets', () => {
    const environment = createEnvironment({ ...valid }, onInvalid);

    expect(onInvalid).not.toHaveBeenCalled();
    expect(environment.STORE_SECRET).toBe(valid.STORE_SECRET);
    expect(environment.SESSION_SECRET).toBe(valid.SESSION_SECRET);
    expect(environment.SECRET_SALT).toBe(valid.SECRET_SALT);
  });

  it.each(['CLIENT_SECRET', 'STORE_SECRET', 'SESSION_SECRET', 'SECRET_SALT'])('can report missing %s', (name) => {
    const env = { ...valid };
    delete env[name];

    createEnvironment(env, onInvalid);

    expect(onInvalid).toHaveBeenCalledTimes(1);
    expect(Object.keys(onInvalid.mock.calls[0][0])).toEqual([name]);
  });

  it.each(['STORE_SECRET', 'SESSION_SECRET', 'SECRET_SALT'])('can report empty %s', (name) => {
    createEnvironment({ ...valid, [name]: '' }, onInvalid);

    expect(onInvalid).toHaveBeenCalledTimes(1);
    expect(Object.keys(onInvalid.mock.calls[0][0])).toEqual([name]);
  });

  it.each(['STORE_SECRET', 'SESSION_SECRET', 'SECRET_SALT'])('can report short %s', (name) => {
    createEnvironment({ ...valid, [name]: 'too-short' }, onInvalid);

    expect(onInvalid).toHaveBeenCalledTimes(1);
    const errors = onInvalid.mock.calls[0][0];
    expect(Object.keys(errors)).toEqual([name]);
    expect(errors[name].message).toContain('at least 16 characters');
    expect(errors[name].message).not.toContain('too-short');
  });

  it('can report missing values as required', () => {
    const env = { ...valid };
    delete env.STORE_SECRET;
    createEnvironment(env, onInvalid);

    expect(onInvalid.mock.calls[0][0].STORE_SECRET).toBeInstanceOf(envalid.EnvMissingError);
  });

  it('can accept secrets of the minimum length', () => {
    createEnvironment({ ...valid, STORE_SECRET: 'a'.repeat(16) }, onInvalid);
    expect(onInvalid).not.toHaveBeenCalled();
  });

  it('can report all invalid values', () => {
    createEnvironment({ PORT: 'not-a-number' }, onInvalid);

    expect(Object.keys(onInvalid.mock.calls[0][0]).sort()).toEqual(
      ['CLIENT_SECRET', 'PORT', 'SECRET_SALT', 'SESSION_SECRET', 'STORE_SECRET'].sort()
    );
  });

  it('can use test values only for tests', () => {
    createEnvironment({ NODE_ENV: 'test' }, onInvalid);
    expect(onInvalid).not.toHaveBeenCalled();

    createEnvironment({ NODE_ENV: 'production' }, onInvalid);
    expect(onInvalid).toHaveBeenCalledTimes(1);

    onInvalid.mockClear();
    createEnvironment({ NODE_ENV: 'development' }, onInvalid);
    expect(onInvalid).toHaveBeenCalledTimes(1);
  });

  it('can start with the test environment of the test runner', () => {
    // Modules that read the environment are loaded with the test values.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { environment } = require('./environment');
    expect(environment.STORE_SECRET.length).toBeGreaterThanOrEqual(16);
  });
});
