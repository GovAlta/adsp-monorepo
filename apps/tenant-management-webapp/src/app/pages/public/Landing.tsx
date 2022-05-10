import React, { useState, createRef, useEffect } from 'react';
import { GoAHeroBanner } from '@abgov/react-components';
import { GoACard } from '@abgov/react-components/experimental';
import bannerBackground from '@assets/BannerBackground.jpg';
import Header from '@components/AppHeader';
import Footer from '@components/Footer';
import Container from '@components/Container';
import { Grid, GridItem } from '@components/Grid';
import { Main } from '@components/Html';
import GoALinkButton from '@components/LinkButton';
import ClockIcon from '@assets/icons/clock.png';
import DashboardScreenIcon from '@assets/icons/dashboard-screenshot.png';

// TODO: replace with ui-components open icon after updated the ui-components
import {
  Section,
  CardContent,
  GrayBox,
  DashBoardImg,
  HeroBannerLayout,
  ServiceLayout,
  ClockImg,
  CardLayout,
  BoldTitle,
  RedirectButton,
  H2,
  Paragraph,
  ContentFootSeparator,
} from './LandingComponents';

import { LandingSample } from './LandingSample';

const LandingPage = (): JSX.Element => {
  const [rowOneMaxHeight, setRowOneMaxHeight] = useState<number>(0);
  const [rowTwoMaxHeight, setRowTwoMaxHeight] = useState<number>(0);
  const maxRowOneDiv = createRef();

  useEffect(() => {
    // file-service-description has longest content in the first row. Need to update, if this is not validated.
    const rowOneMaxHeight = document.getElementById('file-service-description').clientHeight;
    const rowTwoMaxHeight = document.getElementById('event-service-description').clientHeight;
    if (rowOneMaxHeight) {
      setRowOneMaxHeight(rowOneMaxHeight);
      setRowTwoMaxHeight(rowTwoMaxHeight);
    }
    // Due to grid update, have to use ref here
  }, [maxRowOneDiv]);
  return (
    <>
      <Header serviceName="" />
      <Main>
        <HeroBannerLayout>
          <GoAHeroBanner title="" backgroundUrl={bannerBackground}>
            <Container hs={1} vs={3}>
              <Grid>
                <GridItem md={1} />
                <GridItem md={10}>
                  <BoldTitle>The Alberta Digital Service Platform (ADSP)</BoldTitle>
                  <p>
                    Enabling your team to add, configure, and manage a range of services that can integrate with your
                    products.
                  </p>
                  <br />
                  <p>
                    <GoALinkButton buttonType="primary" to="/get-started">
                      Request a tenant
                    </GoALinkButton>
                  </p>
                </GridItem>
                <GridItem md={1} />
              </Grid>
            </Container>
          </GoAHeroBanner>
        </HeroBannerLayout>
        <Section>
          <Container vs={3} hs={1}>
            <Grid>
              <GridItem md={1} />
              <GridItem md={10}>
                <Grid>
                  <GridItem md={6}>
                    <H2>Why ADSP?</H2>
                    <Paragraph>
                      ADSP is a secure in-house cloud-based platform built to enable service teams of the DDI. Users can
                      sign up to take advantage of the platform capabilities within their own products.
                    </Paragraph>
                    <p>
                      Check out the quick-start{' '}
                      <a href="https://glowing-parakeet-0563ab2e.pages.github.io">ADSP guide</a>
                    </p>
                  </GridItem>
                  <GridItem md={0.5} />
                  <GridItem md={5.5}>
                    <DashBoardImg src={DashboardScreenIcon} alt="" />
                  </GridItem>
                </Grid>
              </GridItem>
              <GridItem md={1} />
            </Grid>
          </Container>
        </Section>
        <Section>
          <GrayBox>
            <Container vs={3} hs={1}>
              <Grid>
                <GridItem md={2} />
                <GridItem md={7}>
                  <Grid>
                    <GridItem md={3}>
                      <ClockImg src={ClockIcon} alt="" data-testid="landing-page-clock-img" />{' '}
                    </GridItem>
                    <GridItem md={9}>
                      <h2>Built for teams to move faster</h2>
                      <p>
                        The ADSP comes with services out of the box available to your team with code examples and
                        sandbox environments. Grant your team access in a quick and secure way. Super easy to integrate,
                        built to save time and effort, and help your team deliver faster.
                      </p>
                    </GridItem>
                  </Grid>
                </GridItem>

                <GridItem md={3} />
              </Grid>
            </Container>
          </GrayBox>
        </Section>

        <Section>
          <Container>
            <Grid>
              <GridItem md={1} />
              <GridItem md={10}>
                <ServiceLayout>
                  <H2>Services we offer</H2>
                  <Paragraph>
                    The ADSP provides a catalog of services and capabilities for product teams to leverage in delivering
                    digital services to Albertans. Here are a few of our offerings.
                  </Paragraph>
                </ServiceLayout>
              </GridItem>
              <GridItem md={1} />
            </Grid>
          </Container>

          <Container>
            <Grid>
              <GridItem md={1} />
              <GridItem md={10}>
                <Grid>
                  <GridItem md={4} hSpacing={0.5}>
                    <GoACard type="primary">
                      <CardLayout>
                        <h2>UI components library</h2>
                        <CardContent maxHeight={rowOneMaxHeight}>
                          The design system and UI component library provide reusable patterns and components for your
                          front end application. Choose from components for Angular, React, and Vue.
                        </CardContent>
                        <RedirectButton
                          name="ui-components"
                          url="https://ui-components.alpha.alberta.ca"
                          label="Learn more"
                        />
                      </CardLayout>
                    </GoACard>
                  </GridItem>

                  <GridItem md={4} hSpacing={0.5}>
                    <GoACard type="primary">
                      <CardLayout>
                        <h2>Access</h2>
                        <CardContent maxHeight={rowOneMaxHeight}>
                          Access service allows you to add a secure sign in to your application and services with
                          minimum effort and configuration. No need to deal with storing or authenticating users. It's
                          all available out of the box.
                        </CardContent>

                        <RedirectButton
                          name="keycloak-access-service"
                          url="https://glowing-parakeet-0563ab2e.pages.github.io/services/access-service.html"
                          label="Learn more"
                        />
                      </CardLayout>
                    </GoACard>
                  </GridItem>

                  <GridItem md={4} hSpacing={0.5}>
                    <GoACard type="primary">
                      <CardLayout>
                        <h2>File</h2>
                        <CardContent maxHeight={rowOneMaxHeight}>
                          <div id="file-service-description" ref={maxRowOneDiv as React.RefObject<HTMLDivElement>}>
                            File service provides the ability to upload and download files. Applications can upload
                            files via multipart/form-data requests with the file and related metadata, then later allow
                            users to access metadata of or download the file.
                          </div>
                        </CardContent>
                        <RedirectButton
                          name="file-service"
                          url="https://glowing-parakeet-0563ab2e.pages.github.io/services/file-service.html"
                          label="Learn more"
                        />
                      </CardLayout>
                    </GoACard>
                  </GridItem>
                </Grid>
              </GridItem>
              <GridItem md={1} />
            </Grid>
          </Container>
          <Container vs={3}>
            <Grid>
              <GridItem md={1} />
              <GridItem md={10}>
                <Grid>
                  <GridItem md={4} hSpacing={0.5}>
                    <GoACard type="primary">
                      <CardLayout>
                        <h2>Event</h2>
                        <CardContent id="event-service-description" maxHeight={rowTwoMaxHeight}>
                          Event service provides tenant applications with the ability to send domain events.
                          Applications are able to leverage additional capabilities as side effects through these
                          events.
                        </CardContent>
                        <RedirectButton
                          name="event-service"
                          url="https://glowing-parakeet-0563ab2e.pages.github.io/services/event-service.html"
                          label="Learn more"
                        />
                      </CardLayout>
                    </GoACard>
                  </GridItem>

                  <GridItem md={4} hSpacing={0.5}>
                    <GoACard type="primary">
                      <CardLayout>
                        <h2>Notification</h2>
                        <CardContent maxHeight={rowTwoMaxHeight}>
                          Notifications service provides tenant applications with the ability to configure and manage
                          notifications for your subscribers.
                        </CardContent>

                        <RedirectButton
                          name="notification-service"
                          url="https://glowing-parakeet-0563ab2e.pages.github.io/services/notification-service.html"
                          label="Learn more"
                        />
                      </CardLayout>
                    </GoACard>
                  </GridItem>
                  <GridItem md={4} hSpacing={0.5}></GridItem>
                </Grid>
              </GridItem>
              <GridItem md={1} />
            </Grid>
          </Container>

          <LandingSample />
        </Section>
        <ContentFootSeparator />
        <Footer />
      </Main>
    </>
  );
};

export default LandingPage;
