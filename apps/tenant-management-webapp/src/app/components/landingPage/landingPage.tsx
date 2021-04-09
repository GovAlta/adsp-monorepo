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
import AuthContext from '@lib/authContext';

import '@abgov/react-components/react-components.esm.css';

const LandingPage = () => {
  const history = useHistory();
  const { serviceUrls } = useSelector((store: RootState) => ({
    serviceUrls: store.config.serviceUrls,
  }));

  const tenant = useSelector((state: RootState) => state.tenant);
  const session = useSelector((state: RootState) => state.session);
  const { signIn } = useContext(AuthContext);

  useEffect(() => {
    if (session.authenticated && tenant.name) {
      history.push('/tenant-admin');
    }
  }, [history, tenant, session]);

  return (
    <>
      <Header serviceName="" />
      <GoaHeroBanner title="A platform built for government services" backgroundUrl={bannerBackground}>
        <p>
          DIO Service management platform will enable you to add, configure, and manage a range of services that can
          integrate with your existing application.
        </p>

        <ButtonGroup>
          <GoAButton buttonType="primary" buttonSize="normal" onClick={() => history.push('/sign-up')}>
            Create an Account
          </GoAButton>

          {!session.authenticated ? (
            <GoAButton buttonType="secondary" buttonSize="normal" onClick={() => signIn('/')}>
              Sign In
            </GoAButton>
          ) : (
            <GoAButton buttonType="secondary" buttonSize="normal" onClick={() => history.push('/Realms/CreateRealm')}>
              Create Tenant
            </GoAButton>
          )}
        </ButtonGroup>
      </GoaHeroBanner>

      <Section>
        <Container>
        <ImageTextSection imagePosition="right">
          <div>
            <h2>What does it mean?</h2>
            <p>
              We understand that everyone is busy, and we also know that a lot of teams end up building the same
              components. We want to save everyone time while providing a consistent and pleasant experience for
              Albertans. Our goal is to speed teams up while allowing for incredible control and immersion. Basically,
              we have done the heavy lifting so that you and your teams can focus on the specific pieces unique to your
              project. Sound good? See for yourself how it’s helped other teams out.
            </p>
          </div>
          <img src={caseStudy} alt="" />
        </ImageTextSection>
        </Container>
      </Section>

      <Section backgroundColor="#eee">
        <Container>
          <ImageTextSection imagePosition="left">
            <img src={puzzleIcon} height="200px" alt="Integration" />
            <div>
              <h2>Integrate it into your system</h2>
              <p>
                Take advantage of secure, cloud-based platform by integrating DIO Service Platform with your current
                system
              </p>
            </div>
          </ImageTextSection>
        </Container>
      </Section>

      <Section>
        <Container>
          <h2>Platform Services</h2>
          <p>Find out a bit more about our platform services and how they could help enhance your program services</p>

          <CardGroup>
            <GoACard
              title="UI Component Libraries"
              description={
                <>
                  <p>
                    Common UI components that implement common Government of Alberta styles that can be used across
                    various projects
                  </p>
                  <Link to={`${serviceUrls.uiComponentUrl}/react`}>React</Link> |{' '}
                  <Link to={`${serviceUrls.uiComponentUrl}/vue`}>Vue</Link> |{' '}
                  <Link to={`${serviceUrls.uiComponentUrl}/angular`}>Angular</Link>
                </>
              }
            ></GoACard>

            <GoACard
              title="Keycloak Access Management"
              description="Many GoA Services require secure transmission, storage, and records management of files."
            >
              <Link to={serviceUrls.accessManagementApi}>Learn More</Link>
            </GoACard>

            <GoACard
              title="File Service"
              description="Many GoA Services require secure transmission, storage, and records management of files."
            >
              <Link to="/file-service">Learn More</Link>
            </GoACard>
          </CardGroup>
        </Container>
      </Section>

      <Section backgroundColor="#eee">
        <Container>
          <ImageTextSection imagePosition="right">
            <div>
              <h2>A product built for teams</h2>
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
            </div>
            <img src={userGroup} alt="" height="200px" />
          </ImageTextSection>
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
      </Section>

      <footer>
        <FooterLinks>
          <a href={'https://www.alberta.ca'}>Go to Alberta.ca</a>
          <a href={'https://www.alberta.ca/disclaimer.aspx'}>Disclaimer</a>
          <a href={'https://www.alberta.ca/privacystatement.aspx'}>Privacy</a>
          <a href={'https://www.alberta.ca/accessibility.aspx'}>Accessibility</a>
        </FooterLinks>
        <FooterCopyright>&#169; 2020 Government of Alberta</FooterCopyright>
      </footer>
    </>
  );
};

export default LandingPage;

// *****************
// Styled Components
// *****************

// TODO: make this a global component
const ButtonGroup = styled.div`
  button {
    display: block;
    width: 100%;
    @media (min-width: 768px) {
      display: inline-block;
      width: auto;
    }
  }
`;

const CardGroup = styled.div`
  display: flex;
  flex-flow: wrap;
  justify-content: center;

  > div {
    margin: 10px;
  }
  @media (min-width: 768px) {
    > div {
      max-width: 300px;
    }
  }
`;

interface SectionProps {
  backgroundColor?: string;
}

const Section = styled.div<SectionProps>`
  width: 100%;
  padding: 3rem 2rem;
  background-color: ${(props: SectionProps) => props.backgroundColor ?? 'transparent'};
  @media (min-width: 1024px) {
    .flex {
      margin: 0 auto;
      width: 1024px;
    }
  }
`;

const Container = styled.div`
  @media (min-width: 1024px) {
    margin: 0 auto;
    width: calc(1024px - 4rem);
  }
`;

const FooterLinks = styled.div`
  display: flex;
  justify-content: center;
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

interface ImageTextSectionProps {
  imagePosition: 'left' | 'right';
}

const ImageTextSection = styled.section<ImageTextSectionProps>`
  display: flex;
  flex-direction: ${(props: ImageTextSectionProps) => (props.imagePosition === 'right' ? 'column-reverse' : 'column')};
  align-items: center;
  img {
    margin: 0 0 2rem 0;
  }
  @media (min-width: 768px) {
    flex-direction: row;
    img {
      margin: 0;
      margin-left: ${(props: ImageTextSectionProps) => (props.imagePosition === 'right' ? 4 : 0)}rem;
      margin-right: ${(props: ImageTextSectionProps) => (props.imagePosition === 'left' ? 4 : 0)}rem;
    }
  }
  @media (min-width: 1024px) {
    margin: 0 auto;
  }
`;
