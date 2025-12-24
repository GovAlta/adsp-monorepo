import { GoabAppHeader, GoabMicrositeHeader } from '@abgov/react-components';
import { Band, Container, Footer, Grid, GridItem } from '@core-services/app-common';
import React, { FunctionComponent } from 'react';
import GoALogo from '../../assets/goa-logo.svg';
import { useFeedbackLinkHandler } from '../util/feedbackUtils';
export const Landing: FunctionComponent = () => {
  useFeedbackLinkHandler();
  return (
    <React.Fragment>
      <GoabMicrositeHeader type="alpha" feedbackUrlTarget="self" headerUrlTarget="self" feedbackUrl="#" />
      <GoabAppHeader url="/" heading="Alberta Digital Service Platform - Task management" />
      <Band title="Task management">Work on tasks in queues.</Band>
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
