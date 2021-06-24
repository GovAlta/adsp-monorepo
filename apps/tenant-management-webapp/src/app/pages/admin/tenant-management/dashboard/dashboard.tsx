import React from 'react';
import { GoACard, GoAButton } from '@abgov/react-components';
import { Link } from 'react-router-dom';
import ProductFeatures from '@assets/ProductFeatures.png';
import { Grid, GridItem } from '@components/Grid';
import { Main } from '@components/Html';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';

const Dashboard = () => {
  const { session, tenantManagementWebApp, tenantName } = useSelector((state: RootState) => {
    return {
      session: state.session,
      tenantManagementWebApp: state.config.serviceUrls.tenantManagementWebApp,
      tenantName: state.tenant.name,
    };
  });

  const autoLoginUrl = `${tenantManagementWebApp}/${session.realm}/autologin`;
  console.log(autoLoginUrl + '<autoLoginUrl');

  return (
    <Main>
      <h2>{tenantName} Dashboard</h2>
      <Grid>
        <GridItem xl={8} lg={8} vSpacing={1} hSpacing={0.5}>
          <Grid>
            <GridItem md={6} vSpacing={1} hSpacing={0.5}>
              <GoACard
                title={<Link to="/admin/tenant-admin/access">Access</Link>}
                description="Access allows you to add a secure sign in to you application and services with minimum effort and configuration. No need to deal with storing or authenticating users. It's all available out of the box."
              />
            </GridItem>
            <GridItem md={6} vSpacing={1} hSpacing={0.5}>
              <GoACard
                title={<Link to="/admin/tenant-admin/services/file">File Service</Link>}
                description="The file service provides the capability to upload and download files. Consumers are registered with their own space (tenant) containing file types that include role based access policy, and can associate files to domain records."
              />
            </GridItem>
            <GridItem md={6} vSpacing={1} hSpacing={0.5}>
              <GoACard
                title={<Link to="/admin/tenant-admin/services/service-status">Status</Link>}
                description="The status service allows for easy monitoring of application downtime. Each Application should represent a service that is useful to the end user by itself, such as child care subsidy and child care certification."
              />
            </GridItem>
            <GridItem md={6} vSpacing={1} hSpacing={0.5}>
              <GoACard
                title={<Link to="/admin/tenant-admin/services/event-service">Events</Link>}
                description="The event service provides tenant applications with the ability to send domain events. Applications are able to leverage additional capabilities as side effects through these events."
              />
            </GridItem>
          </Grid>
        </GridItem>
        <GridItem xl={4} lg={4} md={12} vSpacing={0} hSpacing={0}>
          <div className="beta-padding">
            This service is in <b>BETA</b> release. If you have any questions, please email{' '}
            <a href="mailto: DIO@gov.ab.ca">DIO@gov.ab.ca</a>
          </div>
          <div className="copy-url-padding">
            <h3>Sharing Tenant Access</h3>
            <p>To give another user limited access to your realm, send them the url below</p>
            <div className="copy-url">{autoLoginUrl}</div>
            <div className="mb-2">
              <GoAButton
                onClick={() => {
                  navigator.clipboard.writeText(autoLoginUrl);
                }}
              >
                Click to copy
              </GoAButton>
            </div>
          </div>
        </GridItem>
      </Grid>
    </Main>
  );
};
export default Dashboard;
