import { act, renderHook } from '@testing-library/react-hooks';
import { useConfig, configUrl, configKey } from './useConfig';

describe('useConfig', () => {
  it('fetches the config settings', async () => {
    const expectedJson = { notificationServiceUrl: 'some.url' };
    const expectedText = JSON.stringify(expectedJson);

    window.fetch = jest.fn().mockReturnValue(
      Promise.resolve({
        text: () => Promise.resolve(expectedText),
        ok: true
      })
    );

    await act(async () => renderHook(() => {
      const [config,] = useConfig()
      expect(config).toEqual(expectedJson);
    }));
    expect(window.fetch).toBeCalledWith(configUrl);
    expect(window.localStorage.getItem(configKey)).toEqual(expectedText);
  });

  it('uses the cached data', async () => {
    const expectedJson = { notificationServiceUrl: 'some.url' };
    const expectedText = JSON.stringify(expectedJson);

    window.localStorage.setItem(configKey, expectedText);

    await act(async () => renderHook(() => {
      const [config,] = useConfig()
      expect(config).toEqual(expectedJson);
    }));
  });

  it('returns an error on API failure', async () => {
    window.fetch = jest.fn().mockReturnValue(
      Promise.resolve({
        ok: false,
      })
    );

    await act(async () => renderHook(() => {
      const [config, error] = useConfig();
      expect(error).not.toBeNull()
      expect(config).toBeNull()
    }))
  });
});
