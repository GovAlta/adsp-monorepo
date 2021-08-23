import React from 'react';
import { GoACard, GoAButton, GoACallout } from '@abgov/react-components';
import { Link } from 'react-router-dom';
import ReactTooltip from 'react-tooltip';
import { Grid, GridItem } from '@components/Grid';
import { Main, Aside, Page } from '@components/Html';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import styled from 'styled-components';
import CopyIcon from '@icons/copy-outline.svg';

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

  const _afterShow = (copyText) => {
    console.log(JSON.stringify(copyText) + "<copyText")
    navigator.clipboard.writeText(copyText);
  };

  function getKeycloakAdminPortalUsers() {
    return session?.realm ? `${keycloakConfig.url}/admin/${session.realm}/console/#/realms/${session.realm}/users` : keycloakConfig.url;
  }

  const adminDashboard = () => {
    return (
      <div>
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
            <h3>Sharing Tenant Access</h3>
            <p>To give another user limited access to your realm:</p>

            <p>1. Add the 'tenant-admin' role to the user's Assigned roles from <a href={getKeycloakAdminPortalUsers()} rel="noopener noreferrer" target="_blank">here</a></p>
            <div className="small-font">(Role Mapping &#8250; Client Roles &#8250; urn:ads:platform:tenant-service &#8250; Add selected)</div>

            <p>2. Share the following URL to complete the process.</p>

            <div className="copy-url">{autoLoginUrl}</div>
            <GoAButton data-tip="Copied!" data-for="registerTipUrl">
              Click to copy
            </GoAButton>
            <ReactTooltip
              id="registerTipUrl"
              place="top"
              event="click"
              eventOff="blur"
              effect="solid"
              afterShow={() => _afterShow(autoLoginUrl)}
            />
          </DashboardAside>
        </Page>
        <div>
          <div style={{flex: 1}}>
            This service is in <b>BETA</b> release. If you have any questions, please email{' '}
            <a href="mailto: DIO@gov.ab.ca">DIO@gov.ab.ca{' '}</a>
            <a data-tip="Copied!" data-delay-hide='1500' data-for="registerTipEmail">
              <img src={CopyIcon} width="13" alt="Admin" />
            </a>
            <ReactTooltip
              id="registerTipEmail"
              place="top"
              event="click"
              eventOff="click"
              effect="solid"
              afterShow={() => _afterShow("DIO@gov.ab.ca")}
            />
          </div>
        </div>
      </div>
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
  padding-top: 1.6em;

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

  .small-font {
    font-size: var(--fs-sm);
    line-height: normal;
  }
`;
