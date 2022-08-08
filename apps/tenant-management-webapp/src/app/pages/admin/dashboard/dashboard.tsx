import React from 'react';
import { GoAButton, GoACallout } from '@abgov/react-components';
import { GoACard } from '@abgov/react-components/experimental';
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
  const { session, tenantManagementWebApp, tenantName, adminEmail, hasAdminRole, keycloakConfig } = useSelector(
    (state: RootState) => {
      return {
        session: state.session,
        tenantManagementWebApp: state.config.serviceUrls.tenantManagementWebApp,
        tenantName: state.tenant.name,
        adminEmail: state.tenant.adminEmail,
        keycloakConfig: state.config.keycloakApi,
        hasAdminRole:
          state.session?.resourceAccess?.['urn:ads:platform:tenant-service']?.roles?.includes(tenantAdminRole),
      };
    }
  );
  const loginUrl = `${tenantManagementWebApp}/${session.realm}/login`;

  const _afterShow = (copyText) => {
    navigator.clipboard.writeText(copyText);
  };

  function getKeycloakAdminPortalUsers() {
    return session?.realm
      ? `${keycloakConfig.url}/admin/${session.realm}/console/#/realms/${session.realm}/users`
      : keycloakConfig.url;
  }

  const adminDashboard = () => {
    return (
      <DashboardDiv>
        <Page>
          <Main>
            {tenantName && (
              <>
                <h1 data-testid="dashboard-title">{tenantName} dashboard</h1>
                <Grid>
                  <GridItem md={6} vSpacing={1} hSpacing={0.5}>
                    <GoACard type="primary">
                      <h2>
                        <Link to="/admin/access">Access</Link>
                      </h2>
                      <div>
                        Access allows you to add a secure sign in to your application and services with minimum effort
                        and configuration. No need to deal with storing or authenticating users. It's all available out
                        of the box.
                      </div>
                      <div>&nbsp;</div>
                    </GoACard>
                  </GridItem>
                  <GridItem md={6} vSpacing={1} hSpacing={0.5}>
                    <GoACard type="primary">
                      <h2>
                        <Link to="/admin/services/calendar">Calendar</Link>
                      </h2>
                      <div>
                        The calendar service provides information about dates, a model of calendars, calendar events and
                        scheduling. This service manages dates and times in a particular timezone (America/Edmonton)
                        rather than UTC or a particular UTC offset.
                      </div>
                    </GoACard>
                  </GridItem>
                  <GridItem md={6} vSpacing={1} hSpacing={0.5}>
                    <GoACard type="primary">
                      <h2>
                        <Link to="/admin/services/configuration">Configuration</Link>
                      </h2>
                      <div>
                        The configuration service provides a generic json document store for storage and revisioning of
                        infrequently changing configuration. Store configuration against namespace and name keys, and
                        optionally define configuration schemas for write validation.
                      </div>
                    </GoACard>
                  </GridItem>
                  <GridItem md={6} vSpacing={1} hSpacing={0.5}>
                    <GoACard type="primary">
                      <h2>
                        <Link to="/admin/services/directory">Directory</Link>
                      </h2>
                      <div>
                        The directory service is a registry of services and their APIs. Applications can use the
                        directory to lookup URLs for service from a common directory API. Add entries for your own
                        services so they can be found using the directory for service discovery.
                      </div>
                      <div>&nbsp;</div>
                    </GoACard>
                  </GridItem>
                  <GridItem md={6} vSpacing={1} hSpacing={0.5}>
                    <GoACard type="primary">
                      <h2>
                        <Link to="/admin/services/file">File</Link>
                      </h2>
                      <div>
                        The file service provides the capability to upload and download files. Consumers are registered
                        with their own space (tenant) containing file types that include role based access policy, and
                        can associate files to domain records.
                      </div>
                    </GoACard>
                  </GridItem>
                  <GridItem md={6} vSpacing={1} hSpacing={0.5}>
                    <GoACard type="primary">
                      <h2>
                        <Link to="/admin/services/status">Status</Link>
                      </h2>
                      <div>
                        The status service allows for easy monitoring of application downtime. Each application should
                        represent a service that is useful to the end user by itself, such as child care subsidy and
                        child care certification.
                        <div>&nbsp;</div>
                      </div>
                    </GoACard>
                  </GridItem>
                  <GridItem md={6} vSpacing={1} hSpacing={0.5}>
                    <GoACard type="primary">
                      <h2>
                        <Link to="/admin/services/event">Event</Link>
                      </h2>
                      <div>
                        The event service provides tenant applications with the ability to send domain events.
                        Applications are able to leverage additional capabilities as side effects through these events.
                      </div>
                    </GoACard>
                  </GridItem>
                  <GridItem md={6} vSpacing={1} hSpacing={0.5}>
                    <GoACard type="primary">
                      <h2>
                        <Link to="/admin/services/notification">Notification</Link>
                      </h2>
                      <div>
                        The notifications service provides tenant applications with the ability to configure
                        notifications.
                      </div>
                      <div>&nbsp;</div>
                      <div>&nbsp;</div>
                      <div>&nbsp;</div>
                    </GoACard>
                  </GridItem>
                </Grid>
              </>
            )}
          </Main>
          <DashboardAside>
            <h3>Sharing tenant access</h3>
            <p>To give another user limited access to your realm:</p>

            <p>
              1. Add the 'tenant-admin' role to the user's assigned roles from{' '}
              <a href={getKeycloakAdminPortalUsers()} rel="noopener noreferrer" target="_blank">
                here
              </a>
            </p>
            <div className="small-font mt-2">
              (Role Mapping &#8250; Client Roles &#8250; urn:ads:platform:tenant-service &#8250; Add selected)
            </div>

            <p>2. Share the following URL to complete the process.</p>

            <div className="copy-url">
              <a target="_blank" href={loginUrl} rel="noreferrer">
                {loginUrl}
              </a>
            </div>
            <GoAButton data-tip="Copied!" data-for="registerTipUrl">
              Click to copy
            </GoAButton>
            <ReactTooltip
              id="registerTipUrl"
              place="top"
              event="click"
              eventOff="blur"
              effect="solid"
              afterShow={() => _afterShow(loginUrl)}
            />
          </DashboardAside>
        </Page>
        <footer>
          <div style={{ flex: 1 }} data-testid="beta-release">
            This service is in <b>BETA</b> release. If you have any questions, please email{' '}
            <a href="mailto: adsp@gov.ab.ca">adsp@gov.ab.ca</a>
            <a data-tip="Copied!" data-delay-hide="1500" data-for="registerTipEmail">
              <img src={CopyIcon} width="13" alt="Admin" />
            </a>
            <ReactTooltip
              id="registerTipEmail"
              place="top"
              event="click"
              eventOff="click"
              effect="solid"
              afterShow={() => _afterShow('adsp@gov.ab.ca')}
            />
          </div>
        </footer>
      </DashboardDiv>
    );
  };

  const calloutMessage = () => {
    return (
      <Main>
        <h2>{tenantName} dashboard</h2>
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
            font - size: var(--fs-sm);
    background-color: var(--color-gray-100);
    border: 1px solid var(--color-gray-300);
    border-radius: 1px;
    padding: 0.25rem;
    margin-bottom: 1rem;
    margin-top: 0.5rem;
    line-height: normal;
  }

  .small-font {
            font - size: var(--fs-sm);
    line-height: normal;
  }

  .mt-2 {
            margin - top: 2em;
  }
`;
const DashboardDiv = styled.div`
  a {
    &:visited {
      color: var(--color-primary);
    }
  }
  margin-bottom: 2.5rem;
`;
