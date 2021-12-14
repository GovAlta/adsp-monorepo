import React from 'react';
import Header from '@components/AppHeader';
import { Main } from '@components/Html';

const LandingPage = (): JSX.Element => {
  return (
    <>
      <Header serviceName="Subscriber app" />
      <Main>
        <p>Overview page</p>
      </Main>
    </>
  );
};

export default LandingPage;
