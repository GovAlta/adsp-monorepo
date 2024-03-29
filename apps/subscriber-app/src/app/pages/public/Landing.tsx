import React from 'react';
import styled from 'styled-components';
import { Band, Container, Grid, GridItem } from '@core-services/app-common';
import { Main } from '@components/Html';
import AddNotificationType from '@assets/icons/AddNotificationType.png';
import AddNotificationType2 from '@assets/icons/AddNotificationType2.png';
import ContactInformation from '@assets/icons/ContactInformation.png';

const LandingPage = (): JSX.Element => {
  return (
    <Main>
      <CenterText>
        <Band title="Subscription management">Manage your subscription preferences</Band>

        <Section>
          <Container vs={3} hs={1}>
            <Grid>
              <GridItem md={1} />
              <GridItem md={10}>
                <Grid>
                  <GridItem md={12} className="center">
                    <h1>Overview</h1>
                    <p>
                      The subscription management app allows subscribers to manage their subscription preferences and
                      decide how they want to receive notifications regarding the services they are subscribed to. Here
                      are some features that we provide to your subscribers to manage their subscriptions.
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
                    <h2>Notification channel preferences</h2>
                    <p>As a subscriber, your users can opt for a preferred channel to receive notifications.</p>
                  </GridItem>
                  <GridItem md={1} />
                  <GridItem md={4.5}>
                    <DashBoardImg src={ContactInformation} alt="" />
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
                    <DashBoardImg src={AddNotificationType} alt="" />
                  </GridItem>
                  <GridItem md={1} />
                  <GridItem md={6.5} className="center">
                    <h2>Subscription management on a self serve basis</h2>
                    <p>
                      Subscriptions are managed at an application level by default. As a tenant admin, you have an
                      option to provide your subscribers a provision to self-manage their subscriptions for a
                      notification type on a self-serve basis.
                    </p>
                    <p>This option is provided when you decide to add or edit a notification type.</p>
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
                    <h2>Verify notification channel</h2>
                    <p>
                      The verify service allows your subscribers to authenticate their supported notification channels.
                    </p>
                    <p>
                      This service can help prevent simple bots and mistyped email ids, providing greater assurance to
                      your subscribers so that they receive timely notifications.
                    </p>
                  </GridItem>
                  <GridItem md={1} />
                  <GridItem md={4.5}>
                    <DashBoardImg src={AddNotificationType2} alt="" />
                  </GridItem>
                </Grid>
              </GridItem>
              <GridItem md={1} />
            </Grid>
          </Container>
        </Section>
      </CenterText>
    </Main>
  );
};

export default LandingPage;

// *****************
// Styled Components
// *****************

interface SectionProps {
  backgroundColor?: string;
}

const Section = styled.div<SectionProps>`
  background-color: ${(props: SectionProps) => props.backgroundColor ?? 'transparent'};
`;

const DashBoardImg = styled.img`
  box-shadow: 1px 5px 28px 0px #00000033;
`;

const CenterText = styled.div`
  .center {
    align-self: center;
  }
`;
