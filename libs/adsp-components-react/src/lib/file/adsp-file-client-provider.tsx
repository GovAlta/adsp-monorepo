import { createContext, useContext, type ReactNode } from 'react';
import type { IFileClient } from '@abgov/adsp-components-core';

const AdspFileClientContext = createContext<IFileClient | undefined>(undefined);
AdspFileClientContext.displayName = 'AdspFileClientContext';

export interface AdspFileClientProviderProps {
  /** Usually a FileClient from core. Create it once or memoize it. */
  client: IFileClient;
  children?: ReactNode;
}

// Lets File service components below it find the client, so each one only needs to identify its file.
export function AdspFileClientProvider({ client, children }: AdspFileClientProviderProps) {
  return <AdspFileClientContext.Provider value={client}>{children}</AdspFileClientContext.Provider>;
}

export function useAdspFileClient(): IFileClient | undefined {
  return useContext(AdspFileClientContext);
}
