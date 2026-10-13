import { createSelector } from 'reselect';
import { RootState } from '@store/index';
import { TokenHandlerClient } from './models';

// Core clients are used instead of tenant clients with the same ID, as they are by the token handler service.
// The clients are not available until both the tenant and core clients are loaded.
export const selectTokenHandlerClients = createSelector(
  (state: RootState) => state.tokenHandler.clients,
  (state: RootState) => state.tokenHandler.coreClients,
  (clients, coreClients): Record<string, TokenHandlerClient> | null =>
    clients && coreClients ? { ...clients, ...coreClients } : null
);
