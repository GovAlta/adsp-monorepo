import {
  GoabAppFooter,
  GoabAppHeader,
  GoabButton,
  GoabButtonGroup,
  GoabCallout,
  GoabMicrositeHeader,
} from '@abgov/react-components';
import { Band, Container, Footer, Grid, GridItem } from '@core-services/app-common';
import React, { FunctionComponent } from 'react';
import styled from 'styled-components';
import { useFeedbackWidget } from '../util/useFeedbackWidget';

const Main = styled.main`
  overflow: auto;
`;
const AccountActionsDiv = styled.div`
  align-content: center;
  text-align: center;
  padding: var(--goa-space-xs) 0;
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
      <Band title="Sandbox app">This is a sandbox application</Band>
      <Main>
        <div></div>
      </Main>
      <GoabAppFooter />
    </React.Fragment>
  );
};
