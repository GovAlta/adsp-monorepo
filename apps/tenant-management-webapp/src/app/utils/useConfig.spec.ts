import { act, renderHook } from '@testing-library/react-hooks';
import { useConfig, configUrl, configKey, stubConfig } from './useConfig';

describe('useConfig', () => {
  it('fetches the config settings', async () => {
    const expectedJson = { notificationServiceUrl: 'some.url' };
    const expectedText = JSON.stringify(expectedJson);

    window.fetch = jest.fn().mockReturnValue(
      Promise.resolve({
        text: () => Promise.resolve(expectedText),
        ok: true,
      })
    );

    await act(async () =>
      renderHook(() => {
        const [config] = useConfig();
        expect(config).toEqual(expectedJson);
      })
    );
    expect(window.fetch).toBeCalledWith(configUrl);
    expect(window.localStorage.getItem(configKey)).toEqual(expectedText);
  });

  it('uses the cached data', async () => {
    const expectedJson = { notificationServiceUrl: 'some.url' };
    const expectedText = JSON.stringify(expectedJson);

    window.localStorage.setItem(configKey, expectedText);

    await act(async () =>
      renderHook(() => {
        const [config] = useConfig();
        expect(config).toEqual(expectedJson);
      })
    );
  });

  it('returns an error on API failure', async () => {
    window.fetch = jest.fn().mockReturnValue(
      Promise.resolve({
        ok: false,
      })
    );

    await act(async () =>
      renderHook(() => {
        const [config, error] = useConfig();
        expect(error).not.toBeNull();
        expect(config).toBeNull();
      })
    );
  });

  it('stubs the config with default data', async () => {
    stubConfig();

    let _config;
    await act(async () =>
      renderHook(() => {
        const [config] = useConfig();
        _config = config;
      })
    );
    expect(_config).toEqual({});
  });

  it('stubs the config with custom data', async () => {
    const config = {
      accessManagementApi: 'am',
      eventServiceUrl: 'es',
      keyCloakUrl: 'kc',
      notificationServiceUrl: 'ns',
      tenantManagementApi: 'tm',
      uiComponentUrl: 'ui',
    };

    stubConfig(config);

    let _config;
    await act(async () =>
      renderHook(() => {
        const [config] = useConfig();
        _config = config;
      })
    );
    expect(_config).toEqual(config);
  });
});
