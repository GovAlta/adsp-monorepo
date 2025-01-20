import { GoAAppHeader, GoAMicrositeHeader } from '@abgov/react-components-new';
import { Band, Container, Footer, Grid, GridItem } from '@core-services/app-common';
import React, { FunctionComponent } from 'react';
import styled from 'styled-components';
import { useFeedbackLinkHandler } from '../util/feedbackUtils';
import GoALogo from '../../assets/goa-logo.svg';
import DispositionSubmission from '../../assets/DispositionSubmission.png';
import FindFormDrafts from '../../assets/FindFormDrafts.png';

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
      <GoAMicrositeHeader type="alpha" feedbackUrlTarget="self" headerUrlTarget="self" feedbackUrl="#" />
      <GoAAppHeader url="/" heading="Alberta Digital Service Platform - Form administration" />
      <Band title="Form administration">Review forms and submissions.</Band>
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
                      The form administration app allows program staff to process forms and submissions. It works
                      alongside the form app which allows applicants to draft and submit forms. Here are a few ways you
                      can use it to support your program.
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
                    <h3>Review and process submissions</h3>
                    <p>As an assessor, review submissions from your applicants and record a decision.</p>
                  </GridItem>
                  <GridItem md={1} />
                  <GridItem md={4.5}>
                    <DashBoardImg src={DispositionSubmission} />
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
                    <DashBoardImg src={FindFormDrafts} />
                  </GridItem>
                  <GridItem md={1} />
                  <GridItem md={6.5} className="center">
                    <h3>Support applicants</h3>
                    <p>As a clerk, view form drafts and support applicants in completing their submission.</p>
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
