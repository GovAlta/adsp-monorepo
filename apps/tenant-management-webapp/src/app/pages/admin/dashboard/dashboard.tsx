import React from 'react';
import { GoACard, GoAButton, GoACallout } from '@abgov/react-components';
import { Link } from 'react-router-dom';
import ReactTooltip from 'react-tooltip';
import { Grid, GridItem } from '@components/Grid';
import { Main, Aside, Page } from '@components/Html';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import styled from 'styled-components';

const Dashboard = (): JSX.Element => {
  const tenantAdminRole = 'tenant-admin';
  const { session, tenantManagementWebApp, tenantName, adminEmail, hasAdminRole, keycloakConfig } = useSelector((state: RootState) => {
    return {
      session: state.session,
      tenantManagementWebApp: state.config.serviceUrls.tenantManagementWebApp,
      tenantName: state.tenant.name,
      adminEmail: state.tenant.adminEmail,
      keycloakConfig: state.config.keycloakApi,
      hasAdminRole: state.session?.resourceAccess?.['urn:ads:platform:tenant-service']?.roles?.includes(
        tenantAdminRole
      ),
    };
  });
  const autoLoginUrl = `${tenantManagementWebApp}/${session.realm}/autologin`;

  const _afterShow = () => {
    navigator.clipboard.writeText(autoLoginUrl);
  };

  function getKeycloakAdminPortalUsers() {
    return session?.realm ? `${keycloakConfig.url}/admin/${session.realm}/console/#/realms/${session.realm}/users` : keycloakConfig.url;
  }

  const adminDashboard = () => {
    return (
      <Page>
        <Main>
          <h2>{tenantName} Dashboard</h2>
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
        </Main>
        <DashboardAside>
          <p>
            This service is in <b>BETA</b> release. If you have any questions, please email{' '}
            <a href="mailto: DIO@gov.ab.ca">DIO@gov.ab.ca</a>
          </p>
          <h3>Sharing Tenant Access</h3>
          <p>To give another user limited access to your realm, send them the url below and <a href={getKeycloakAdminPortalUsers()} rel="noopener noreferrer" target="_blank">
                add</a> the 'tenant-admin' role to the user's <i>Assigned Roles</i> under <i>Role Mappings</i> &#8250; <i>Client Roles</i> &#8250; <i>urn:ads:platform:tenant-service</i></p>
          <div className="copy-url">{autoLoginUrl}</div>
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
        </DashboardAside>
      </Page>
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

  return hasAdminRole ? adminDashboard() : calloutMessage();
};
export default Dashboard;

const DashboardAside = styled(Aside)`
  .copy-url {
    font-size: var(--fs-sm);
    background-color: var(--color-gray-100);
    border: 1px solid var(--color-gray-300);
    border-radius: 1px;
    padding: 0.25rem;
    margin-bottom: 1rem;
    margin-top: 0.5rem;
    line-height: normal;
  }
`;
