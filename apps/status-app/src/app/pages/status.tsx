import React, { useEffect } from 'react';
import { GoAHeader } from '@abgov/react-components';

import '@abgov/core-css/goa-core.css';
import '@abgov/core-css/goa-components.css';
import '@abgov/core-css/src/lib/stories/page-template/page-template.story.scss';
import { Grid, GridItem } from '@components/Grid';
import ServiceStatus from './statusCard';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { fetchApplications } from '@store/status/actions';
import { RootState } from '@store/index';
import { PageLoader } from '@components/PageLoader';

import moment from 'moment';

const ServiceStatusPage = (): JSX.Element => {
  const { config } = useSelector((state: RootState) => ({
    config: state.config,
  }));
  const location = useLocation();
  const name = location.pathname.slice(1) || config.platformTenantRealm;
  const dispatch = useDispatch();

  const { applications } = useSelector((state: RootState) => ({
    applications: state.application?.applications,
  }));

  useEffect(() => {
    dispatch(fetchApplications(name));
  }, [name]);

  const services = () => {
    return (
      <div className="small-container">
        <PageLoader />
        <h2 data-testid="service-name">All {applications[0].name || 'platform'} services</h2>
        <p>
          These are the services currently being offered by{' '}
          {location.pathname.slice(1) ? applications[0].name : 'the Alberta Digital Service Platform'}. All statuses are
          in real time and reflect current states of the individual services. Please{' '}
          <a href="mailto: DIO@gov.ab.ca">contact support</a> for additional information or any other inquiries
          regarding service statuses.
        </p>
        <br />
        <Grid>
          {applications.map((app, index) => {
            return (
              <GridItem key={index} md={12} vSpacing={1} hSpacing={0.5}>
                <ServiceStatus
                  data-testid={`service-${app.name}`}
                  name={app.name}
                  state={app.status}
                  date={app.statusTimestamp ? moment(app.statusTimestamp).calendar() : 'Never Ran Yet'}
                  description={app.description}
                  notices={app.notices}
                />
              </GridItem>
            );
          })}
        </Grid>
      </div>
    );
  };

  const noServices = () => {
    return (
      <div className="small-container">
        <h2>No services at this address</h2>
        <p>Either there are no services available by this provider, or you have an incorrect ID</p>
      </div>
    );
  };

  const SectionView = () => {
    return <div>{applications && applications.length > 0 ? services() : noServices()}</div>;
  };

  return (
    <ServiceStatusesCss>
      <GoAHeader serviceLevel="beta" serviceName="Alberta Digital Service Platform" serviceHome="/" />
      <div className="goa-banner">
        <div className="small-font">Alberta Digital Service Platform &rarr; Status & Outages</div>
        <hr />
        <h1>Status & Outages</h1>
        <div className="descriptor">Real time monitoring of our applications and services</div>
      </div>
      <main>
        <section>
          <SectionView />
        </section>
        <section>{}</section>
      </main>
      <Footer>
        <a href="https://www.alberta.ca">Go to Alberta.ca</a>
        <FooterLinks>
          <a href="https://www.alberta.ca/disclaimer.aspx">Disclaimer</a>
          <a href="https://www.alberta.ca/privacystatement.aspx">Privacy</a>
          <a href="https://www.alberta.ca/accessibility.aspx">Accessibility</a>
        </FooterLinks>
        <FooterCopyright>&#169; 2020 Government of Alberta</FooterCopyright>
      </Footer>
    </ServiceStatusesCss>
  );
};

const Footer = styled.div`
  padding-top: 20px;
  text-align: center;
  background-color: #f1f1f1;
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

const ServiceStatusesCss = styled.div`
  .small-container {
    max-width: 700px;
    padding: 20px;
    margin: 0 auto;
  }

  .small-font {
    font-size: 10px;
  }

  .flex {
    flex: 1;
  }
`;

export default ServiceStatusPage;
