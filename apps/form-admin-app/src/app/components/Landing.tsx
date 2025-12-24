import { GoabAppHeader, GoabMicrositeHeader } from '@abgov/react-components';
import { Band, Footer } from '@core-services/app-common';
import React, { FunctionComponent } from 'react';
import styled from 'styled-components';
import { useFeedbackLinkHandler } from '../util/feedbackUtils';
import GoALogo from '../../assets/goa-logo.svg';

const Main = styled.main`
  overflow: auto;
`;

const DashBoardImg = styled.img`
  box-shadow: 1px 5px 28px 0px #00000033;
`;

export const Landing: FunctionComponent = () => {
  useFeedbackLinkHandler();
  return (
    <React.Fragment>
      <GoabMicrositeHeader type="alpha" feedbackUrlTarget="self" headerUrlTarget="self" feedbackUrl="#" />
      <GoabAppHeader url="/" heading="Alberta Digital Service Platform - Form management" />
      <Band title="Form management"></Band>
      <Main></Main>
      <Footer logoSrc={GoALogo} />
    </React.Fragment>
  );
};
