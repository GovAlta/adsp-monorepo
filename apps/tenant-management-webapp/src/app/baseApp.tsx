import React, { createContext, useState } from 'react';
import Header from './header';
import useConfig from './utils/useConfig';

export interface HeaderContext {
  setTitle: (title: string) => void;
}
export const HeaderCtx = createContext<HeaderContext>(null);

function BaseApp({ children }) {
  const [, state, error] = useConfig();
  const [ title, setTitle ] = useState<string>('');

  return (
    <HeaderCtx.Provider value={{ setTitle }}>
      <Header serviceName={title} />
      {state === 'loading' && <div>Loading...</div>}
      {state === 'error' && <div>{error}</div>}
      {state === 'loaded' && <div>{children}</div>}
    </HeaderCtx.Provider>
  );
}

export default BaseApp;
