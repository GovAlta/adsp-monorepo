import { act, renderHook } from '@testing-library/react-hooks';
import {
  useConfig,
  configUrl,
  configKey,
  stubConfig,
  State,
  Config,
} from './useConfig';

describe('useConfig', () => {

  beforeEach(() => {
    localStorage.removeItem('config-key');
  })

  it('fetches the config settings', async () => {
    const expectedJson = { notificationServiceUrl: 'some.url' };
    const expectedText = JSON.stringify(expectedJson);

    window.fetch = jest.fn().mockReturnValue(
      Promise.resolve({
        text: () => Promise.resolve(expectedText),
        ok: true,
      })
    );

    let config: Config, state: State, error: string;
    await act(async () =>
      renderHook(() => {
        [config, state, error] = useConfig();
      })
    );
    expect(config).toEqual(expectedJson);
    expect(window.fetch).toBeCalledWith(configUrl);
    expect(window.localStorage.getItem(configKey)).toEqual(expectedText);
    expect(state).toBe('loaded');
    expect(error).toBeFalsy();
  });

  it('uses the cached data', async () => {
    const expectedJson = { notificationServiceUrl: 'some.url' };
    const expectedText = JSON.stringify(expectedJson);

    window.localStorage.setItem(configKey, expectedText);

    let config: Config;
    await act(async () =>
      renderHook(() => {
        [config] = useConfig();
      })
    );
    expect(config).toEqual(expectedJson);
  });

  it('returns an error on API failure', async () => {
    window.fetch = jest.fn().mockReturnValue(
      Promise.resolve({
        ok: false,
      })
    );

    let config: Config, error: string;
    await act(async () =>
      renderHook(() => {
        [config, , error] = useConfig();
      })
    );
    expect(error).not.toBeNull();
    expect(config).toBeNull();
  });

  it('stubs the config with default data', async () => {
    stubConfig();

    let config: Config;
    await act(async () =>
      renderHook(() => {
        [config] = useConfig();
      })
    );
    expect(config).toEqual({});
  });

  it('stubs the config with custom data', async () => {
    const expectedConfig = {
      accessManagementApi: 'am',
      eventServiceUrl: 'es',
      keycloakUrl: 'kc',
      notificationServiceUrl: 'ns',
      tenantManagementApi: 'tm',
      uiComponentUrl: 'ui',
    };

    stubConfig(expectedConfig);

    let config: Config;
    await act(async () =>
      renderHook(() => {
        [config] = useConfig();
      })
    );
    expect(expectedConfig).toEqual(config);
  });

  it('handles the failed to fetch', async () => {
    window.fetch = jest.fn().mockReturnValue(
      Promise.resolve({
        ok: false,
      })
    );

    let config: Config, state: State, error: string;
    await act(async () =>
      renderHook(() => {
        [config, state, error] = useConfig();
      })
    );
    expect(config).toBeNull();
    expect(state).toEqual('error')
    expect(error).toBe('failed to fetch config settings');
  });

  it('handles the failed parse JSON', async () => {
    window.fetch = jest.fn().mockReturnValue(
      Promise.resolve({
        text: () => Promise.resolve('[invalid json]'),
        ok: true,
      })
    );

    let config: Config, state: State, error: string;
    await act(async () =>
      renderHook(() => {
        [config, state, error] = useConfig();
      })
    );
    expect(config).toBeNull();
    expect(state).toEqual('error')
    expect(error).toBe('failed to parse json');
  });
});
