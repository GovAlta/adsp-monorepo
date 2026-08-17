import { GoabAppHeader, GoabMicrositeHeader } from '@abgov/react-components';
import { Band, Container, Footer, Grid, GridItem } from '@core-services/app-common';
import React, { FunctionComponent } from 'react';
import styled from 'styled-components';
import { useFeedbackLinkHandler } from '../util/feedbackUtils';
import GoALogo from '../../assets/goa-logo.svg';
import MakeFormAvailable from '../../assets/MakeFormAvailable.png';
import UseUIComponents from '../../assets/UseUIComponents.png';
import ComplexMultiStepForms from '../../assets/ComplexMultiStepForms.png';

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

      <GoabAppHeader url="https://www.alberta.ca/" heading="Alberta Digital Service Platform - Form" />
      <Band title="Form">Draft, save and submit information using forms.</Band>
      <Main>
        <section>
          <Container vs={3} hs={1}>
            <Grid>
              <GridItem md={1} />
              <GridItem md={10}>
                <Grid>
                  <GridItem md={12} className="center">
                    <h2>Overview</h2>
                    <p>
                      The form app allows users to fill in and submit forms. Configure forms and make them available to
                      users to quickly accept intake applications. Here are some features that we provide to support
                      user form submissions.
                    </p>
                  </GridItem>
                </Grid>
              </GridItem>
              <GridItem md={1} />
            </Grid>
          </Container>
          <Container vs={3} hs={1}>
            <Grid>
              <GridItem md={1} />
              <GridItem md={10}>
                <Grid>
                  <GridItem md={6.5} className="center">
                    <h3>Forms available to users now</h3>
                    <p>
                      Configure forms and start using them right away. The form app makes each form available at a
                      specific URL and supports deep linking so you direct users from a landing page on{' '}
                      <a href="https://alberta.ca">alberta.ca</a>
                    </p>
                  </GridItem>
                  <GridItem md={1} />
                  <GridItem md={4.5}>
                    <DashBoardImg src={MakeFormAvailable} alt="Make form available" />
                  </GridItem>
                </Grid>
              </GridItem>
              <GridItem md={1} />
            </Grid>
          </Container>
          <Container vs={3} hs={1}>
            <Grid>
              <GridItem md={1} />
              <GridItem md={10}>
                <Grid>
                  <GridItem md={4.5}>
                    <DashBoardImg src={UseUIComponents} alt="Use UI components" />
                  </GridItem>
                  <GridItem md={1} />
                  <GridItem md={6.5} className="center">
                    <h3>Designed for a recognizable experience</h3>
                    <p>
                      Form are based on the Government of Alberta <a href="https://design.alberta.ca/">Design System</a>{' '}
                      and created from its UI components. Configure forms based on what your program needs from users,
                      and let the system ensure design standards are followed.
                    </p>
                  </GridItem>
                </Grid>
              </GridItem>
              <GridItem md={1} />
            </Grid>
          </Container>
          <Container vs={3} hs={1}>
            <Grid>
              <GridItem md={1} />
              <GridItem md={10}>
                <Grid>
                  <GridItem md={6.5} className="center">
                    <h3>Support simple or complex forms</h3>
                    <p>
                      Create simple forms with a few fields that users can fill in and submit without signing in; or
                      create complex multi-step forms that users can start and come back to later with their{' '}
                      <a href="https://alberta.ca">alberta.ca</a> login account.
                    </p>
                  </GridItem>
                  <GridItem md={1} />
                  <GridItem md={4.5}>
                    <DashBoardImg src={ComplexMultiStepForms} alt="Complex multi-step forms" />
                  </GridItem>
                </Grid>
              </GridItem>
              <GridItem md={1} />
            </Grid>
          </Container>
        </section>
      </Main>
      <Footer logoSrc={GoALogo} />
    </React.Fragment>
  );
};
