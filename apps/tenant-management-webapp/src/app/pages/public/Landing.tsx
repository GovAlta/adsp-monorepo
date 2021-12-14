import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { GoAHeroBanner } from '@abgov/react-components';
import { GoACard } from '@abgov/react-components/experimental';
import caseStudy from '@assets/CaseStudy.png';
import bannerBackground from '@assets/BannerBackground.jpg';
import userGroup from '@icons/user-group.svg';
import puzzleIcon from '@icons/extension-puzzle-outline.svg';
import Header from '@components/AppHeader';
import { RootState } from '@store/index';

import Container from '@components/Container';
import { Grid, GridItem } from '@components/Grid';
import { Main } from '@components/Html';
import GoALinkButton from '@components/LinkButton';

const LandingPage = (): JSX.Element => {
  const { serviceUrls } = useSelector((store: RootState) => ({
    serviceUrls: store.config?.serviceUrls,
  }));

  return (
    <>
      <Header serviceName="" />
      <Main>
        <GoAHeroBanner title="" backgroundUrl={bannerBackground}>
          <Container hs={1}>
            <BoldTitle>The Alberta Digital Service Platform</BoldTitle>
            <p>
              Enabling you to add, configure, and manage a range of services that can integrate with your new or
              existing project. Quick to deploy, easy to manage and free to use.
            </p>

            <GoALinkButton buttonType="primary" to="/get-started">
              Get Started
            </GoALinkButton>
          </Container>
        </GoAHeroBanner>

        <Section>
          <Container vs={3} hs={1}>
            <Grid>
              <GridItem md={7}>
                <h2>What does it mean?</h2>
                <p>
                  We understand that everyone is busy, and we also know that a lot of teams end up building the same
                  components. We want to save everyone time while providing a consistent and pleasant experience for
                  Albertans. Our goal is to speed teams up while allowing for incredible control and immersion.
                  Basically, we have done the heavy lifting so that you and your teams can focus on the specific pieces
                  unique to your project. Sound good? See for yourself how it’s helped other teams out.
                </p>
              </GridItem>
              <GridItem md={4}>
                <img src={caseStudy} alt="" />
              </GridItem>
            </Grid>
          </Container>
        </Section>

        <Section backgroundColor="#eee">
          <Container vs={3} hs={1}>
            <Grid>
              <GridItem md={3}>
                <img src={puzzleIcon} height="200px" alt="Integration" />
              </GridItem>
              <GridItem md={9}>
                <div>
                  <h2>Integrate it into your system</h2>
                  <p>
                    Take advantage of secure, cloud-based platform by integrating DIO Service Platform with your current
                    system
                  </p>
                </div>
              </GridItem>
            </Grid>
          </Container>
        </Section>

        <Section>
          <Container vs={3} hs={1}>
            <h2>Platform Services</h2>
            <p>Find out a bit more about our platform services and how they could help enhance your program services</p>

            <Grid>
              <GridItem md={4} vSpacing={1} hSpacing={0.5}>
                <GoACard title="UI Component Libraries" type="primary">
                  <div>
                    Common UI components that implement common Government of Alberta styles that can be used across
                    various projects.
                  </div>
                  <a href={`${serviceUrls?.uiComponentUrl}/react`}>React</a>&nbsp;|&nbsp;
                  <a href={`${serviceUrls?.uiComponentUrl}/vue`}>Vue</a>&nbsp;|&nbsp;
                  <a href={`${serviceUrls?.uiComponentUrl}/angular`}>Angular</a>
                </GoACard>
              </GridItem>

              <GridItem md={4} vSpacing={1} hSpacing={0.5}>
                <GoACard title="Keycloak Access Management" type="primary">
                  <div>Many GoA Services require secure transmission, storage, and records management of files.</div>
                  <a href={serviceUrls?.accessManagementApi}>Learn More</a>
                  <div>&nbsp;</div>
                </GoACard>
              </GridItem>
              <GridItem md={4} vSpacing={1} hSpacing={0.5}>
                <GoACard title="File service" type="primary">
                  <div>Many GoA Services require secure transmission, storage, and records management of files.</div>
                  <Link to="/file-service">Learn More</Link>
                  <div>&nbsp;</div>
                </GoACard>
              </GridItem>
            </Grid>
          </Container>
        </Section>

        <Section backgroundColor="#eee">
          <Container vs={3} hs={1}>
            <Grid>
              <GridItem md={8}>
                <h2>Built for teams</h2>
                <h3>Administrators</h3>
                <p>
                  Setup and control the access and individual platform services through the fine grain control over
                  roles and permissions.
                </p>
                <h3>Staff</h3>
                <p>
                  Empower staff who regularly post notices, and send messages by giving them the tools to craft and
                  manage their communications
                </p>
                <h3>Developers</h3>
                <p>
                  Service management platform was designed with developers in mind, integrations are quick to setup and
                  configuration is easy.
                </p>
              </GridItem>
              <GridItem md={3}>
                <img src={userGroup} alt="" height="200px" />
              </GridItem>
            </Grid>
          </Container>
        </Section>

        <Section>
          <Container vs={3} hs={1}>
            <h2>Questions?</h2>
            <p>
              If you're a government of Alberta service interested in using this service, please{' '}
              <a href="mailto:dio@gov.ab.ca">contact the Digital Innovation Office</a>
            </p>
          </Container>
          <Footer>
            <a href="https://www.alberta.ca">Go to Alberta.ca</a>
            <FooterLinks>
              <a href="https://www.alberta.ca/disclaimer.aspx">Disclaimer</a>
              <a href="https://www.alberta.ca/privacystatement.aspx">Privacy</a>
              <a href="https://www.alberta.ca/accessibility.aspx">Accessibility</a>
            </FooterLinks>
            <FooterCopyright>&#169; 2020 Government of Alberta</FooterCopyright>
          </Footer>
        </Section>
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

const Footer = styled(Container)`
  text-align: center;
`;

const FooterLinks = styled.div`
  display: flex;
  justify-content: center;
  margin: 0 1rem;
  > * {
    display: inline-block;
    margin-right: 1rem;
    &:last-of-type {
      margin-right: 0;
    }
  }
`;

const FooterCopyright = styled.div`
  text-align: center;
  padding: 1rem;
`;
const BoldTitle = styled.h1`
  && {
    font-weight: var(--fw-bold);
  }
`;
