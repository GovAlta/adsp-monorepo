import React from 'react';
import { Container } from 'react-bootstrap';
import Header from './header';
import useConfig from './utils/useConfig';

function BaseApp({children}) {

  const [, state, error] = useConfig();

  return (
    <div>
      <Header url={'/'} urlName="Home" serviceName="" />
      { state === 'loading' && <div>Loading...</div>}
      { state === 'error' && <div>{error}</div> }
      { state === 'loaded' && <Container>{children}</Container> }
    </div>
  );
}

export default BaseApp;
