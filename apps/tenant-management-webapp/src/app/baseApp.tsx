import React from 'react';
import { Container } from 'react-bootstrap';
import Header from './header';

function BaseApp({ children }) {
  return (
    <div>
      <Header url={'/'} urlName="Home" serviceName="" />
      <Container>{children}</Container>
    </div>
  );
}

export default BaseApp;
