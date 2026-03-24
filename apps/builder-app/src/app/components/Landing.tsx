import { GoabAppHeader, GoabMicrositeHeader } from '@abgov/react-components';
import { Band, Container, Footer, Grid, GridItem } from '@core-services/app-common';
import React, { FunctionComponent } from 'react';
import GoALogo from '../../assets/goa-logo.svg';

export const Landing: FunctionComponent = () => {
  return (
    <React.Fragment>
      <GoabMicrositeHeader type="alpha" feedbackUrlTarget="self" headerUrlTarget="self" feedbackUrl="#" />
      <GoabAppHeader url="https://www.alberta.ca/" heading="Alberta Digital Service Platform - Builder" />
      <Band title="Builder">Configure and launch digital experiences for your service.</Band>
      <main>
        <section>
          <Container vs={3} hs={1}>
            <Grid>
              <GridItem md={1} />
              <GridItem md={10}>
                <Grid>
                  <GridItem md={12} className="center">
                    <h2>Overview</h2>
                    <p>
                      Builder app helps teams assemble and publish service-specific experiences on ADSP. Start by
                      signing in with your tenant, then configure workflows and release changes safely.
                    </p>
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
