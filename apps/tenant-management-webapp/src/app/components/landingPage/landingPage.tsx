import React, { useContext, useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { GoAButton, GoaHeroBanner, GoACard } from '@abgov/react-components';
import caseStudy from '@assets/CaseStudy.png';
import bannerBackground from '@assets/BannerBackground.jpg';
import userGroup from '@icons/user-group.svg';
import puzzleIcon from '@icons/extension-puzzle-outline.svg';
import Header from '@components/appHeader';
import { RootState } from '@store/index';

import '@abgov/react-components/react-components.esm.css';
import Container from '@components/_/Container';
import { Grid, GridItem } from '@components/_/Grid';

const LandingPage = () => {
  const history = useHistory();
  const { serviceUrls } = useSelector((store: RootState) => ({
    serviceUrls: store.config.serviceUrls,
  }));

  const tenant = useSelector((state: RootState) => state.tenant);
  const session = useSelector((state: RootState) => state.session);

  useEffect(() => {
    if (session.authenticated && tenant.name) {
      history.push('/tenant-admin');
    }
  }, [history, tenant, session]);

  return (
    <>
      <Header serviceName="" />
      <GoaHeroBanner title="" backgroundUrl={bannerBackground}>
        <Container>
          <Grid>
            <GridItem md={12}>
              <h2 style={{ color: 'white' }}>The Alberta Digital Service Platform</h2>
              <p>
                Enabling you to add, configure, and manage a range of services that can integrate with your new or
                existing project. Quick to deploy, easy to manage and free to use.
              </p>

              <div>
                <GoAButton buttonType="primary" buttonSize="normal" onClick={() => history.push('/tenant/start')}>
                  Get Started
                </GoAButton>
              </div>
            </GridItem>
          </Grid>
        </Container>
      </GoaHeroBanner>
      <Section>
        <Container>
          <Grid>
            <GridItem md={7}>
              <h2>What does it mean?</h2>
              <p>
                We understand that everyone is busy, and we also know that a lot of teams end up building the same
                components. We want to save everyone time while providing a consistent and pleasant experience for
                Albertans. Our goal is to speed teams up while allowing for incredible control and immersion. Basically,
                we have done the heavy lifting so that you and your teams can focus on the specific pieces unique to
                your project. Sound good? See for yourself how it’s helped other teams out.
              </p>
            </GridItem>
            <GridItem md={4}>
              <img src={caseStudy} alt="" />
            </GridItem>
          </Grid>
        </Container>
      </Section>

      <Section backgroundColor="#eee">
        <Container>
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
        <Container>
          <h2>Platform Services</h2>
          <p>Find out a bit more about our platform services and how they could help enhance your program services</p>

          <Grid>
            <GridItem md={4}>
              <GoACard
                title="UI Component Libraries"
                description="Common UI components that implement common Government of Alberta styles that can be used across various projects."
              >
                <Link to={`${serviceUrls.uiComponentUrl}/react`}>React</Link>&nbsp;|&nbsp;
                <Link to={`${serviceUrls.uiComponentUrl}/vue`}>Vue</Link>&nbsp;|&nbsp;
                <Link to={`${serviceUrls.uiComponentUrl}/angular`}>Angular</Link>
              </GoACard>
            </GridItem>

            <GridItem md={4}>
              <GoACard
                title="Keycloak Access Management"
                description="Many GoA Services require secure transmission, storage, and records management of files."
              >
                <Link to={serviceUrls.accessManagementApi}>Learn More</Link>
              </GoACard>
            </GridItem>
            <GridItem md={4}>
              <GoACard
                title="File Service"
                description="Many GoA Services require secure transmission, storage, and records management of files."
              >
                <Link to="/file-service">Learn More</Link>
              </GoACard>
            </GridItem>
          </Grid>
        </Container>
      </Section>

      <Section backgroundColor="#eee">
        <Container>
          <Grid>
            <GridItem md={8}>
              <h2>Built for teams</h2>
              <h4>Administrators</h4>
              <p>
                Setup and control the access and individual platform services through the fine grain control over roles
                and permissions.
              </p>
              <h4>Staff</h4>
              <p>
                Empower staff who regularly post notices, and send messages by giving them the tools to craft and manage
                their communications
              </p>
              <h4>Developers</h4>
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
        <Container>
          <h2>Questions?</h2>
          <p>
            If you're a government of Alberta service interested in using this service, please{' '}
            <a href="dio@gov.ab.ca">contact the Digital Innovation Office</a>
          </p>
        </Container>
        <Footer>
          <a href={'https://www.alberta.ca'}>Go to Alberta.ca</a>
          <FooterLinks>
            <a href={'https://www.alberta.ca/disclaimer.aspx'}>Disclaimer</a>
            <a href={'https://www.alberta.ca/privacystatement.aspx'}>Privacy</a>
            <a href={'https://www.alberta.ca/accessibility.aspx'}>Accessibility</a>
          </FooterLinks>
          <FooterCopyright>&#169; 2020 Government of Alberta</FooterCopyright>
        </Footer>
      </Section>
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
