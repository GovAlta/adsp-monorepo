import { GoabAppHeader, GoabButton, GoabButtonGroup, GoabCallout, GoabMicrositeHeader } from '@abgov/react-components';
import { Band, Container, Footer, Grid, GridItem } from '@core-services/app-common';
import React, { FunctionComponent } from 'react';
import styled from 'styled-components';
//import { useFeedbackLinkHandler } from '../util/feedbackUtils';
import {
  AppDispatch,
  configInitializedSelector,
  formSelector,
  initializeTenant,
  loginUser,
  logoutUser,
  tenantSelector,
  userSelector,
} from '../state';
import { dispatch } from '@abgov/ui-components-common';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import { Tenant } from '../lib/keycloak';
import { useAdspFeedbackWidget } from '../util/useFeedbackWidget';

const Main = styled.main`
  overflow: auto;
`;
const AccountActionsDiv = styled.div`
  align-content: center;
  text-align: center;
  padding: var(--goa-space-xs) 0;
`;

export const Landing: FunctionComponent = () => {
  useAdspFeedbackWidget();
  return (
    <React.Fragment>
      <GoabMicrositeHeader type="alpha" />

      <GoabAppHeader
        url="https://www.alberta.ca/"
        heading="Alberta Digital Service Platform - Sandbox app"
      ></GoabAppHeader>
      <Band title="Sandbox">This is a sandbox application</Band>
      <Main>
        <div></div>
      </Main>
    </React.Fragment>
  );
};
