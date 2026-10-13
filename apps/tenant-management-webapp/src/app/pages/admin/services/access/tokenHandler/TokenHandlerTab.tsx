import React, { FunctionComponent, useState } from 'react';
import { TokenHandlerClientList } from './TokenHandlerClientList';
import { TokenHandlerClientDetail } from './TokenHandlerClientDetail';

// Selection is held in state rather than the URL: the Access tabs don't update the route, so a URL-based
// selection would outlive the tab and reopen the previous client when returning to it.
export const TokenHandlerTab: FunctionComponent = () => {
  const [clientId, setClientId] = useState<string | null>(null);

  return clientId ? (
    <TokenHandlerClientDetail clientId={clientId} onBack={() => setClientId(null)} />
  ) : (
    <TokenHandlerClientList onSelect={setClientId} />
  );
};
