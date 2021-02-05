import React from 'react';

import caseStudy from '../../../assets/CaseStudy.png';
import integrate from '../../../assets/Integrate.png';
import bannerBackground from '../../../assets/BannerBackground.jpg';
import document from '../../../assets/files-icon.svg';
import messageIcon from '../../../assets/message-icon.svg';
import servicePartners from '../../../assets/partners-icon.svg';
import productFeatures from '../../../assets/ProductFeatures.png';
import { GoAButton, GoaHeroBanner, GoACard } from '@abgov/react-components';
import Header from '../../header';
import { useHistory } from 'react-router-dom';

import { Container, Row, Col } from 'react-bootstrap';
import numberFormatter from '../../utils/numberFormatter';
import useConfig from '../../utils/useConfig';

import 'bootstrap/dist/css/bootstrap.min.css';
import '@abgov/react-components/react-components.esm.css';

const LandingPage = () => {
  const history = useHistory();
  const [config, state] = useConfig();

  return (
    <div>
      { state === 'loaded' && (
        <div>
          <Header serviceName="" />
          <div className="contain-text">
            <GoaHeroBanner
              title="A platform built for government services"
              backgroundUrl={bannerBackground}
            >
              <div className="banner-content">
                <div style={{ fontSize: '20px' }}>
                  DIO Service management platform will enable you to add, configure,
                  and manage a range of services that can integrate with your
                  existing application.
              </div>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                  <div style={{ margin: '15px 30px 15px 0' }}>
                    <GoAButton
                      buttonType="primary"
                      buttonSize="normal"
                      onClick={() => history.push('/sign-up')}
                    >
                      Create an Account
                  </GoAButton>
                  </div>
                  <div style={{ margin: '15px 30px 15px 0' }}>
                    <GoAButton
                      buttonType="secondary"
                      buttonSize="normal"
                      onClick={() => history.push('/login')}
                    >
                      Sign In
                  </GoAButton>
                  </div>
                </div>
              </div>
            </GoaHeroBanner>
          </div>
          <Container className="mt-4 mb-4">
            <Row>
              <Col xs={12} md={6} className="mb-4">
                <h2 className="mb-3">What does it mean?</h2>
                <div>
                  We understand that everyone is busy, and we also know that a lot
                  of teams end up building the same components. We want to save
                  everyone time while providing a consistent and pleasant experience
                  for Albertans. Our goal is to speed teams up while allowing for
                  incredible control and immersion. Basically, we have done the
                  heavy lifting so that you and your teams can focus on the specific
                  pieces unique to your project. Sound good? See for yourself how
                  it’s helped other teams out.
              </div>
              </Col>
              <Col
                xs={12}
                md={6}
                style={{
                  flex: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  flexDirection: 'column',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      margin: '10px',
                    }}
                  >
                    <img src={caseStudy} alt="" />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      margin: '10px',
                    }}
                  >
                    <GoAButton
                      buttonType="secondary"
                      content="View Case Study"
                      onClick={() => history.push('/case-study')}
                    />
                  </div>
                </div>
              </Col>
            </Row>
          </Container>
          <div style={{ backgroundColor: '#f1f1f1' }}>
            <Container>
              <Row>
                <Col xs={12} md={6} className="mb-3 mt-3">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      margin: '40px',
                    }}
                  >
                    <img src={integrate} width={'100%'} alt="" />
                  </div>
                </Col>
                <Col
                  xs={12}
                  md={6}
                  style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      justifyContent: 'center',
                      margin: '10px',
                      flexDirection: 'column',
                    }}
                  >
                    <h2 className="mb-3">Integrate it into your system</h2>
                    <div className="mb-3">
                      Take advantage of secure, cloud-based platform by intergrating
                      DIO Service Platform with your current system
                  </div>
                    <a href={'/integration'}>
                      Learn how to integrate with Alberta's Service Management
                      Platform
                  </a>
                  </div>
                </Col>
              </Row>
            </Container>
          </div>
          <Container>
            <Row className="mb-5 mt-5">
              <Col xs={12}>
                <h2>Platform Services</h2>
                <div>
                  Find out a bit more about our platform services and how they could
                  help enhance your program services
              </div>
              </Col>
              <Col xs={12} md={6} className="mb-3 mt-3">
                <div style={{ flex: 1, margin: '10px' }}>
                  <GoACard
                    title="UI Component Libraries"
                    description="Common UI components that implement common Government of Alberta styles that can be used across various projects"
                    cardWidth="auto"
                  >
                    <div style={{ margin: '5px 11px 5px 0' }}>
                      <GoAButton
                        buttonType="primary"
                        buttonSize="normal"
                        onClick={() =>
                          (window.location.href = `${config.uiComponentUrl}/react`)
                        }
                      >
                        React
                    </GoAButton>
                    </div>
                    <div style={{ margin: '5px 11px 5px 0' }}>
                      <GoAButton
                        buttonType="primary"
                        buttonSize="normal"
                        onClick={() =>
                          (window.location.href = `${config.uiComponentUrl}/angular`)
                        }
                      >
                        Angular
                    </GoAButton>
                    </div>
                    <div style={{ margin: '5px 11px 5px 0' }}>
                      <GoAButton
                        buttonType="primary"
                        buttonSize="normal"
                        onClick={() =>
                          (window.location.href = `${config.uiComponentUrl}/vue`)
                        }
                      >
                        Vue
                    </GoAButton>
                    </div>
                  </GoACard>
                </div>
              </Col>
              <Col xs={12} md={6} className="mb-3 mt-3">
                <div style={{ flex: 1, margin: '10px' }}>
                  <GoACard
                    title="Keycloak Access Management"
                    description="Many GoA Services require secure transmission, storage, and records management of files."
                    cardWidth="auto"
                  >
                    <GoAButton
                      buttonType="primary"
                      buttonSize="normal"
                      onClick={() =>
                        (window.location.href = config.accessManagementApi)
                      }
                    >
                      Learn More
                  </GoAButton>
                  </GoACard>
                </div>
              </Col>
              <Col xs={12} md={6} className="mb-3 mt-3">
                <div style={{ flex: 1, margin: '10px' }}>
                  <GoACard
                    title="File Service"
                    description="Many GoA Services require secure transmission, storage, and records management of files."
                    cardWidth="auto"
                  >
                    <GoAButton
                      buttonType="primary"
                      buttonSize="normal"
                      onClick={() => history.push('/file-service')}
                    >
                      Learn More
                  </GoAButton>
                  </GoACard>
                </div>
              </Col>
              <Col xs={12} md={6} className="mb-3 mt-3">
                <div style={{ flex: 1, margin: '10px' }}>
                  <GoACard
                    title="Service Measures"
                    description="Transparency of service performance and health metrics is a key part of delivering better service."
                    cardWidth="auto"
                  >
                    <GoAButton
                      buttonType="primary"
                      buttonSize="normal"
                      onClick={() => history.push('/service-measures')}
                    >
                      Learn More
                  </GoAButton>
                  </GoACard>
                </div>
              </Col>
              <Col xs={12} md={6} className="mb-3 mt-3">
                <div style={{ flex: 1, margin: '10px' }}>
                  <GoACard
                    title="App Status"
                    description="Keeping your service running and users informed when there is maintenance or updates is vital to any well run service."
                    cardWidth="auto"
                  >
                    <GoAButton
                      buttonType="primary"
                      buttonSize="normal"
                      onClick={() => history.push('/app-status')}
                    >
                      Learn More
                  </GoAButton>
                  </GoACard>
                </div>
              </Col>
              <Col xs={12} md={6} className="mb-3 mt-3">
                <div style={{ flex: 1, margin: '10px' }}>
                  <GoACard
                    title="Notifications"
                    description="Send emails or text messages to keep the public informed and assured when interacting with your service."
                    cardWidth="auto"
                  >
                    <GoAButton
                      buttonType="primary"
                      buttonSize="normal"
                      onClick={() => history.push('/notifications')}
                    >
                      Learn More
                  </GoAButton>
                  </GoACard>
                </div>
              </Col>
            </Row>
          </Container>
          <div style={{ backgroundColor: '#f1f1f1' }} className="pb-5 pt-5">
            <Container>
              <Row>
                <Col xs={12} md={6} className="mb-4">
                  <h2 className="mb-3">A product built for teams</h2>
                  <h4>Administrators</h4>
                  <p>
                    Setup and control the access and individual platform services
                    through the fine grain control over roles and permissions.
                </p>
                  <h4>Staff</h4>
                  <p>
                    Empower staff who regularly post notices, and send messages by
                    giving them the tools to craft and manage their communications
                </p>
                  <h4>Developers</h4>
                  <p>
                    Service management platform was designed with developers in
                    mind, integrations are quick to setup and configuration is easy.
                </p>
                </Col>
                <Col
                  xs={12}
                  md={6}
                  style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      margin: '10px',
                    }}
                  >
                    <img
                      src={productFeatures}
                      alt=""
                      max-width="80%"
                      height="300px"
                    />
                  </div>
                </Col>
              </Row>
            </Container>
          </div>
          <div style={{ backgroundColor: '#feba35' }} className="pb-5 pt-5">
            <Container>
              <Row>
                <Col
                  xs={12}
                  md={4}
                  style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    flexDirection: 'row',
                  }}
                  className="pb-2 pt-2"
                >
                  <img src={servicePartners} alt="" width="90px" height="90px" />
                  <div style={{ marginLeft: '16px', justifyContent: 'center' }}>
                    <h1 style={{ fontWeight: 'bold' }}>{numberFormatter(12)}</h1>
                  Service Partners
                </div>
                </Col>
                <Col
                  xs={12}
                  md={4}
                  style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    flexDirection: 'row',
                  }}
                  className="pb-2 pt-2"
                >
                  <img src={messageIcon} alt="" width="90px" height="90px" />
                  <div style={{ marginLeft: '16px', justifyContent: 'center' }}>
                    <h1 style={{ fontWeight: 'bold' }}>
                      {numberFormatter(532534)}
                    </h1>
                  Messages Sent
                </div>
                </Col>
                <Col
                  xs={12}
                  md={4}
                  style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    flexDirection: 'row',
                  }}
                  className="pb-2 pt-2"
                >
                  <img src={document} alt="" width="90px" height="90px" />
                  <div style={{ marginLeft: '16px', justifyContent: 'center' }}>
                    <h1 style={{ fontWeight: 'bold' }}>
                      {numberFormatter(4700000)}
                    </h1>
                  Files stored
                </div>
                </Col>
              </Row>
            </Container>
          </div>
          <Container className="pb-4 pt-4">
            <Row>
              <Col xs={12} md={12} className="mb-3">
                <h2 className="mb-3">Questions?</h2>
                <p>
                  If you're a government of Alberta service interested in using this
                service, please{' '}
                  <a href="dio@gov.ab.ca">contact the Digital Innovation Office</a>
                </p>
              </Col>
            </Row>
          </Container>
          <div style={{ backgroundColor: '#f1f1f1' }} className="pb-2 pt-2">
            <Container>
              <Row>
                <Col xs={12} md={12} className="mb-3 pt-3">
                  <a
                    href={'https://www.alberta.ca'}
                    style={{ margin: '12px 20px 12px 0' }}
                  >
                    Go to Alberta.ca
                </a>
                  <a
                    href={'https://www.alberta.ca/disclaimer.aspx'}
                    style={{ margin: '12px 20px 12px 0' }}
                  >
                    Disclaimer
                </a>
                  <a
                    href={'https://www.alberta.ca/privacystatement.aspx'}
                    style={{ margin: '12px 20px 12px 0' }}
                  >
                    Privacy
                </a>
                  <a
                    href={'https://www.alberta.ca/accessibility.aspx'}
                    style={{ margin: '12px 20px 12px 0' }}
                  >
                    Accessibility
                </a>

                  <div style={{ float: 'right' }}>
                    &#169; 2020 Government of Alberta
                </div>
                </Col>
              </Row>
            </Container>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
