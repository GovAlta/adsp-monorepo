import { GoabAppFooter, GoabAppHeader, GoabMicrositeHeader } from '@abgov/react-components';
import { Band } from '@core-services/app-common';
import React, { FunctionComponent } from 'react';
import styled from 'styled-components';
import { useFeedbackWidget } from '../hooks/useFeedbackWidget';

const Main = styled.main`
  overflow: auto;
`;

export const Landing: FunctionComponent = () => {
  useFeedbackWidget();
  return (
    <React.Fragment>
      <GoabMicrositeHeader type="alpha" />

      <GoabAppHeader
        url="https://www.alberta.ca/"
        heading="Alberta Digital Service Platform - Sandbox app"
      ></GoabAppHeader>
      <Band title="Sandbox application"></Band>
      <Main>
        <div></div>
      </Main>
      <GoabAppFooter />
    </React.Fragment>
  );
};
