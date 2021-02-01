import { config } from 'process';
import { useEffect, useState } from 'react';

export const configUrl = '/config/config.json';
export const configKey = 'config-key';

/**
 * Interface of the properties contained within the config.json file
 * returned from the API
 */
interface Config {
  notificationServiceUrl: string;
  keyCloakUrl: string;
  tenantManagementApi: string;
  accessManagementApi: string;
  uiComponentUrl: string;
}

/**
 * Config states
 */
type State = 'loading' | 'error' | 'loaded';

/**
 * React hook that fetches the environment specific configuration
 */
export function useConfig(): [Config, State, string] {
  const [config, setConfig] = useState<Config>();
  const [error, setError] = useState<string>();
  const [state, setState] = useState<State>('loading');

  useEffect(() => {
    const _getConfig = async () => {
      setState('loading')
      try {
        setConfig(await fetchConfig());
        setState('loaded')
      } catch(e) {
        setState('error')
        if (e instanceof Error) {
          setError((e as Error).message)
        } else {
          setError('failed to fetch config');
        }
      }
    };
    _getConfig();
  }, []);

  return [config, state, error];
}

// Private

async function fetchConfig(): Promise<Config> {
  if (process.env.NODE_ENV === 'development') {
    return null;
  }
  let cached = localStorage.getItem(configKey);
  if (!cached) {
    const res = await fetch(configUrl);
    if (!res.ok) {
      throw new Error('failed to fetch config settings');
    }
    const text = await res.text();
    localStorage.setItem(configKey, text);
    cached = text;
  }

  return cached && JSON.parse(cached);
}

export default useConfig;
