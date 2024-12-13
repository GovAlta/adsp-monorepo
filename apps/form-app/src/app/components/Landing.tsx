import { GoAAppHeader, GoAMicrositeHeader } from '@abgov/react-components-new';
import { Band, Container, Footer, Grid, GridItem } from '@core-services/app-common';
import React, { FunctionComponent } from 'react';
import GoALogo from '../../assets/goa-logo.svg';
import { useFeedbackLinkHandler } from '../util/feedbackUtils';

export const Landing: FunctionComponent = () => {
  useFeedbackLinkHandler();

  return (
    <React.Fragment>
      <GoAMicrositeHeader type="alpha" feedbackUrlTarget="self" headerUrlTarget="self" feedbackUrl="#" />

      <GoAAppHeader url="https://www.alberta.ca/" heading="Alberta Digital Service Platform - Form" />
      <Band title="Form">Draft, save and submit information using forms.</Band>
      <main>
        <section>
          <Container vs={3} hs={1}>
            <Grid>
              <GridItem md={1} />
              <GridItem md={10}>
                <Grid>
                  <GridItem md={12} className="center">
                    <h2>Overview</h2>
                    <p></p>
                  </GridItem>
                </Grid>
              </GridItem>
              <GridItem md={1} />
            </Grid>
          </Container>
        </section>
      </main>
      <Footer logoSrc={GoALogo} />
    </React.Fragment>
  );
};
