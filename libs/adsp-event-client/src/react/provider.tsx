import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { AdspEventClient, createAdspEventClient } from '../lib/client';
import type { AdspEventClientOptions, AdspEventHandler, AdspEventStatus, HandlerOptions } from '../lib/types';

const AdspEventContext = createContext<AdspEventClient | null>(null);

export type AdspEventProviderProps = PropsWithChildren<AdspEventClientOptions>;

/**
 * Provides a stream connection to useAdspEvent hooks below it.
 *
 * Place it at app bootstrap, above components that load data, so the subscription starts before the first fetch.
 */
export function AdspEventProvider({ children, ...options }: AdspEventProviderProps) {
  // Callbacks are read through a ref so a re-render with new inline functions doesn't reconnect.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const { pushServiceUrl, tenant, stream, criteria } = options;
  const criteriaKey = JSON.stringify(criteria || null);
  const client = useMemo(
    () =>
      createAdspEventClient({
        ...optionsRef.current,
        pushServiceUrl,
        tenant,
        stream,
        criteria: JSON.parse(criteriaKey),
        getToken: () => optionsRef.current.getToken?.(),
        onResync: () => optionsRef.current.onResync?.(),
        onError: (event, error) => optionsRef.current.onError?.(event, error),
      }),
    [pushServiceUrl, tenant, stream, criteriaKey],
  );

  // Child effects (handler registration) run before this effect, so handlers are in place before replay starts.
  useEffect(() => {
    client.start();
    return () => client.stop();
  }, [client]);

  return <AdspEventContext.Provider value={client}>{children}</AdspEventContext.Provider>;
}

function useClient(): AdspEventClient {
  const client = useContext(AdspEventContext);
  if (!client) {
    throw new Error('useAdspEvent must be used within an AdspEventProvider.');
  }
  return client;
}

/**
 * Handles one or more events (`namespace:name`) from the provider's stream.
 *
 * The event is acknowledged when the handler resolves; if it rejects it is retried, and it may be delivered again after
 * a reconnect or reload, so the handler must be idempotent.
 */
export function useAdspEvent(names: string | string[], handler: AdspEventHandler, options?: HandlerOptions): void {
  const client = useClient();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const namesKey = (Array.isArray(names) ? names : [names]).join('|');
  const optionsKey = JSON.stringify(options || {});
  useEffect(
    () => client.on(namesKey.split('|'), (event, context) => handlerRef.current(event, context), JSON.parse(optionsKey)),
    [client, namesKey, optionsKey],
  );
}

export function useAdspEventStatus(): { status: AdspEventStatus } {
  const client = useClient();
  const status = useSyncExternalStore(
    (listener) => client.onStatus(listener),
    () => client.getStatus(),
  );
  return { status };
}
