import React, { useState, createRef, useEffect } from 'react';
import styled from 'styled-components';
import { GoAHeroBanner, GoAButton } from '@abgov/react-components';
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
import { ReactComponent as OpenIcon } from '@assets/icons/open.svg';

interface RedirectButtonProps {
  url: string;
  name: string;
  label: string;
}

const RedirectButton = ({ url, name, label }: RedirectButtonProps): JSX.Element => {
  const Content = styled.div`
    display: grid;
    grid-template-columns: 4fr 1fr;
    grid-gap: 4px;

    svg {
      width: 23px;
      height: 24px;
      position: relative;
      top: -4px;
      stroke: var(--color-primary);
    }
  `;
  const ButtonContainer = styled.div`
    :hover svg {
      stroke: var(--color-primary-dark);
    }
  `;
  return (
    <ButtonContainer>
      <GoAButton
        buttonType="tertiary"
        data-testid={`redirect-button-${name}`}
        onClick={() => {
          window.location.replace(url);
        }}
      >
        <Content>
          {label} <OpenIcon />
        </Content>
      </GoAButton>
    </ButtonContainer>
  );
};

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
        <GoAHeroBanner title="" backgroundUrl={bannerBackground}>
          <Container hs={1} vs={3}>
            <Grid>
              <GridItem md={1} />
              <GridItem md={10}>
                <BoldTitle>The Alberta Digital Service Platform (ADSP)</BoldTitle>
                <p>
                  Enabling your team to add, configure and manage a range of services that can integrate with your
                  projects.
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

        <Section>
          <Container vs={3} hs={1}>
            <Grid>
              <GridItem md={1} />
              <GridItem md={10}>
                <Grid>
                  <GridItem md={6}>
                    <h2>Why ADSP?</h2>
                    <p>
                      ADSP is a secure in-house cloud-based platform built to enable service teams of the DDI. Users can
                      sign up to take advantage of the platform and build applications to manage their projects.
                    </p>
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
                        The ADSP comes with services out of the box available for your team with code examples and sandbox environments. Grant your team access in a quick and secure way. Super easy to integrate with projects, built to save time and effort and help your team deliver faster.
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
                <h2>Service we offer</h2>
                <p>
                  The ADSP provides a huge catalog of services and existing capabilities for product teams to leverage
                  and deliver on time quality service to Albertans. Here are few of our offerings.
                </p><br />
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
                        <CardTitle>UI components library</CardTitle>
                        <CardContent maxHeight={rowOneMaxHeight}>
                          We're encouraging companies to turn our oil and gas resources into more valuable products –
                          creating good jobs for Albertans.
                        </CardContent>
                        <RedirectButton
                          name="ui-components"
                          url="https://ui-components.alpha.alberta.ca"
                          label="Learn more"
                        />
                      </CardLayout>
                    </GoACard>
                  </GridItem>

                  <GridItem md={4} vSpacing={1} hSpacing={0.5}>
                    <GoACard type="primary">
                      <CardLayout>
                        <CardTitle>Keycloak access service</CardTitle>
                        <CardContent maxHeight={rowOneMaxHeight}>
                          Access allows you to add a secure sign in to you application and services with minimum effort
                          and configuration. No need to deal with storing or authenticating users. It's all available
                          out of the box.
                        </CardContent>

                        <RedirectButton
                          name="keycloak-access-service"
                          url="https://glowing-parakeet-0563ab2e.pages.github.io/services/access-service.html"
                          label="Learn more"
                        />
                      </CardLayout>
                    </GoACard>
                  </GridItem>

                  <GridItem md={4} vSpacing={1} hSpacing={0.5}>
                    <GoACard type="primary">
                      <CardLayout>
                        <CardTitle>File service</CardTitle>
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
          <Container vs={3} hs={1}>
            <Grid>
              <GridItem md={1} />
              <GridItem md={10}>
                <Grid>
                  <GridItem md={4} vSpacing={1} hSpacing={0.5}>
                    <GoACard type="primary">
                      <CardLayout>
                        <CardTitle>Event service</CardTitle>
                        <CardContent id="event-service-description" maxHeight={rowTwoMaxHeight}>
                          The event service provides tenant applications with the ability to send domain events.
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

                  <GridItem md={4} vSpacing={1} hSpacing={0.5}>
                    <GoACard type="primary">
                      <CardLayout>
                        <CardTitle>Notification service</CardTitle>
                        <CardContent maxHeight={rowTwoMaxHeight}>
                          The notifications service provides tenant applications with the ability to configure and
                          manage notifications for your subscribers.
                        </CardContent>

                        <RedirectButton
                          name="notification-service"
                          url="https://glowing-parakeet-0563ab2e.pages.github.io/services/notification-service.html"
                          label="Learn more"
                        />
                      </CardLayout>
                    </GoACard>
                  </GridItem>
                  <GridItem md={4} vSpacing={1} hSpacing={0.5}></GridItem>
                </Grid>
              </GridItem>
              <GridItem md={1} />
            </Grid>
          </Container>
        </Section>
        <Footer />
      </Main>
    </>
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

//display: ${(props: PagePros) => (props.ready === true || props.ready === undefined ? 'flex' : 'none')};

interface CardContentProps {
  maxHeight: number;
}
const CardContent = styled.div`
  line-height: 1.75em;
  min-height: ${(props: CardContentProps) => {
    const width = window.innerWidth;
    if (width < 768) {
      return 'initial';
    }
    return `${props.maxHeight}px`;
  }};
  margin-bottom: 1.75em;
`;
const CardLayout = styled.div`
  padding-top: 0.75em;
  padding-bottom: 1.5em;
`;

const CardTitle = styled.div`
  font-size: 24px;
  margin-bottom: 1.25em;
  text-align: left;
  color: var(--color-blue-500);
  text-decoration: underline;
`;

const BoldTitle = styled.h1`
  && {
    font-weight: var(--fw-bold);
  }
`;

const GrayBox = styled.div`
  padding-top: 2.5em;
  background-color: var(--color-gray-100);
  padding-bottom: 2.5em;
`;

const DashBoardImg = styled.img`
  box-shadow: 1px 5px 28px 0px #00000033;
`;

const ClockImg = styled.img`
  margin-top: 1.5em;
  height: 130px;
  width: 130px !important;
`;
