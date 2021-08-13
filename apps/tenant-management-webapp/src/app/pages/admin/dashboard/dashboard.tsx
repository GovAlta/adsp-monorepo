import React from 'react';
import { GoACard, GoAButton, GoACallout } from '@abgov/react-components';
import { Link } from 'react-router-dom';
import ReactTooltip from 'react-tooltip';
import { Grid, GridItem } from '@components/Grid';
import { Main, Aside } from '@components/Html';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import styled from 'styled-components';

const Dashboard = (): JSX.Element => {
  const { session, tenantManagementWebApp, tenantName, state, hasAdminRole, adminEmail } = useSelector(
    (state: RootState) => {
      return {
        session: state.session,
        tenantManagementWebApp: state.config.serviceUrls.tenantManagementWebApp,
        tenantName: state.tenant.name,
        hasAdminRole: state.tenant.hasAdminRole,
        adminEmail: state.tenant.adminEmail,
        state: state,
      };
    }
  );

  console.log(JSON.stringify(state) + '<state');

  const autoLoginUrl = `${tenantManagementWebApp}/${session.realm}/autologin`;

  const _afterShow = () => {
    navigator.clipboard.writeText(autoLoginUrl);
  };

  const adminDashboard = () => {
    return (
      <Main>
        <h2>{tenantName} Dashboard</h2>
        <Grid>
          <GridItem xl={8} lg={8} vSpacing={1} hSpacing={0.5}>
            <Grid>
              <GridItem md={6} vSpacing={1} hSpacing={0.5}>
                <GoACard
                  title={<Link to="/admin/access">Access</Link>}
                  description="Access allows you to add a secure sign in to you application and services with minimum effort and configuration. No need to deal with storing or authenticating users. It's all available out of the box."
                />
              </GridItem>
              <GridItem md={6} vSpacing={1} hSpacing={0.5}>
                <GoACard
                  title={<Link to="/admin/services/files">File Service</Link>}
                  description="The file service provides the capability to upload and download files. Consumers are registered with their own space (tenant) containing file types that include role based access policy, and can associate files to domain records."
                />
              </GridItem>
              <GridItem md={6} vSpacing={1} hSpacing={0.5}>
                <GoACard
                  title={<Link to="/admin/services/status">Status</Link>}
                  description="The status service allows for easy monitoring of application downtime. Each Application should represent a service that is useful to the end user by itself, such as child care subsidy and child care certification."
                />
              </GridItem>
              <GridItem md={6} vSpacing={1} hSpacing={0.5}>
                <GoACard
                  title={<Link to="/admin/services/events">Events</Link>}
                  description="The event service provides tenant applications with the ability to send domain events. Applications are able to leverage additional capabilities as side effects through these events."
                />
              </GridItem>
            </Grid>
          </GridItem>
          <GridItem xl={4} lg={4} md={12} vSpacing={0} hSpacing={0}>
            <DashboardSide>
              <div className="beta-padding">
                This service is in <b>BETA</b> release. If you have any questions, please email{' '}
                <a href="mailto: DIO@gov.ab.ca">DIO@gov.ab.ca</a>
              </div>
              <div className="copy-url-padding">
                <h3>Sharing Tenant Access</h3>
                <p>To give another user limited access to your realm, send them the url below</p>
                <div className="copy-url">{autoLoginUrl}</div>
                <div className="mb-2">
                  <GoAButton data-tip="Copied!" data-for="registerTip">
                    Click to copy
                  </GoAButton>
                  <ReactTooltip
                    id="registerTip"
                    place="top"
                    event="click"
                    eventOff="blur"
                    effect="solid"
                    afterShow={_afterShow}
                  />
                </div>
              </div>
            </DashboardSide>
          </GridItem>
        </Grid>
      </Main>
    );
  };

  const calloutMessage = () => {
    return (
      <Main>
        <h2>{tenantName} Dashboard</h2>
        <GoACallout type="important" data-testid="delete-modal">
          <h3>Access to tenant admin app requires tenant-admin role</h3>
          <p>
            You require administrator role to access the admin interface and will need to contact the tenant created at{' '}
            <a href={`mailto: ${adminEmail}`}>{adminEmail}</a>
          </p>
        </GoACallout>
      </Main>
    );
  };

  return <>{hasAdminRole ? adminDashboard() : calloutMessage()}</>;
};
export default Dashboard;

const DashboardSide = styled(Aside)`
  .mb-2 {
    margin-bottom: 20px;
  }

  .copy-url {
    font-size: 11px;
    background-color: #f9f9f9;
    border: 2px solid #e1e1e1;
    border-radius: 2px;
    padding: 4px;
    line-height: normal;
  }

  .copy-url-padding {
    padding: 7rem 1rem 0 3rem;

    @media (max-width: 1024px) {
      padding: 3rem 0 0 0;
    }
  }

  .beta-padding {
    padding: 0 1.5rem 0 3.5rem;

    @media (max-width: 1024px) {
      padding: 0 0 0 0;
    }
  }
`;
