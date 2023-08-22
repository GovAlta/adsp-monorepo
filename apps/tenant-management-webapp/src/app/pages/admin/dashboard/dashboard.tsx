import React from 'react';
import { GoAContainer, GoACallout } from '@abgov/react-components-new';
import { Link } from 'react-router-dom';
import { Grid, GridItem } from '@components/Grid';
import { Main, Page } from '@components/Html';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { ExternalLink } from '@components/icons/ExternalLink';
import BetaBadge from '@icons/beta-badge.svg';
import { DashboardAside, DashboardDiv, HeadingDiv, ListWrapper } from './styled-components';
import SupportLinks from '@components/SupportLinks';
import LinkCopyComponent from '@components/CopyLink/CopyLink';

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
                    <GoAContainer accent="thin" type="interactive">
                      <h2>
                        <Link to="/admin/access">Access</Link>
                      </h2>
                      <div>
                        Access allows you to add a secure sign in to your application and services with minimum effort
                        and configuration. No need to deal with storing or authenticating users. It's all available out
                        of the box.
                      </div>
                      <div>&nbsp;</div>
                      <div>&nbsp;</div>
                    </GoAContainer>
                  </GridItem>
                  <GridItem md={6} vSpacing={1} hSpacing={0.5}>
                    <GoAContainer accent="thin" type="interactive">
                      <HeadingDiv>
                        <h2>
                          <Link to="/admin/services/calendar">Calendar</Link>
                        </h2>
                        <img src={BetaBadge} alt="Calendar Service" width={39} height={23} />
                      </HeadingDiv>
                      <div>
                        The calendar service provides information about dates, a model of calendars, calendar events and
                        scheduling. This service manages dates and times in a particular timezone (America/Edmonton)
                        rather than UTC or a particular UTC offset.
                      </div>
                    </GoAContainer>
                  </GridItem>
                  <GridItem md={6} vSpacing={1} hSpacing={0.5}>
                    <GoAContainer accent="thin" type="interactive">
                      <h2>
                        <Link to="/admin/services/configuration">Configuration</Link>
                      </h2>
                      <div>
                        The configuration service provides a generic json document store for storage and revisioning of
                        infrequently changing configuration. Store configuration against namespace and name keys, and
                        optionally define configuration schemas for write validation.
                      </div>
                    </GoAContainer>
                  </GridItem>
                  <GridItem md={6} vSpacing={1} hSpacing={0.5}>
                    <GoAContainer accent="thin" type="interactive">
                      <h2>
                        <Link to="/admin/services/directory">Directory</Link>
                      </h2>
                      <div>
                        The directory service is a registry of services and their APIs. Applications can use the
                        directory to lookup URLs for service from a common directory API. Add entries for your own
                        services so they can be found using the directory for service discovery.
                      </div>
                      <div>&nbsp;</div>
                    </GoAContainer>
                  </GridItem>
                  <GridItem md={6} vSpacing={1} hSpacing={0.5}>
                    <GoAContainer accent="thin" type="interactive">
                      <h2>
                        <Link to="/admin/services/event">Event</Link>
                      </h2>
                      <div>
                        The event service provides tenant applications with the ability to send domain events.
                        Applications are able to leverage additional capabilities as side effects through these events.
                      </div>
                      <div>&nbsp;</div>
                      <div>&nbsp;</div>
                    </GoAContainer>
                  </GridItem>
                  <GridItem md={6} vSpacing={1} hSpacing={0.5}>
                    <GoAContainer accent="thin" type="interactive">
                      <h2>
                        <Link to="/admin/services/file">File</Link>
                      </h2>
                      <div>
                        The file service provides the capability to upload and download files. Consumers are registered
                        with their own space (tenant) containing file types that include role based access policy, and
                        can associate files to domain records.
                      </div>
                    </GoAContainer>
                  </GridItem>
                  <GridItem md={6} vSpacing={1} hSpacing={0.5}>
                    <GoAContainer accent="thin" type="interactive">
                      <HeadingDiv>
                        <h2>
                          <Link to="/admin/services/form">Form</Link>
                        </h2>
                        <img src={BetaBadge} alt="form Service" width={39} height={23} />
                      </HeadingDiv>
                      <div>
                        The form service provides capabilities to support user form submission. Form definitions are
                        used to describe types of form with roles for applicants, clerks who assist them, and assessors
                        who process the submissions.
                      </div>
                    </GoAContainer>
                  </GridItem>
                  <GridItem md={6} vSpacing={1} hSpacing={0.5}>
                    <GoAContainer accent="thin" type="interactive">
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
                      <div>&nbsp;</div>
                    </GoAContainer>
                  </GridItem>
                  <GridItem md={6} vSpacing={1} hSpacing={0.5}>
                    <GoAContainer accent="thin" type="interactive">
                      <h2>
                        <Link to="/admin/services/pdf">PDF</Link>
                      </h2>
                      <div>
                        The PDF service provides PDF operations like generating new PDFs from templates. It runs
                        operations as asynchronous jobs and uploads the output PDF files to the file service.
                      </div>
                      <div>&nbsp;</div>
                      <div>&nbsp;</div>
                      <div>&nbsp;</div>
                      <div>&nbsp;</div>
                      <div>&nbsp;</div>
                      <div>&nbsp;</div>
                    </GoAContainer>
                  </GridItem>
                  <GridItem md={6} vSpacing={1} hSpacing={0.5}>
                    <GoAContainer accent="thin" type="interactive">
                      <HeadingDiv>
                        <h2>
                          <Link to="/admin/services/script">Script</Link>
                        </h2>
                        <img src={BetaBadge} alt="Script Service" width={39} height={23} />
                      </HeadingDiv>
                      <div>
                        The script services provides the ability to execute configured Lua scripts. Applications can use
                        this to capture simple logic in configuration. For example, benefits calculations can be
                        configured in a script and executed via the script service API so that policy changes to the
                        formula can implemented through configuration change.
                      </div>
                    </GoAContainer>
                  </GridItem>
                  <GridItem md={6} vSpacing={1} hSpacing={0.5}>
                    <GoAContainer accent="thin" type="interactive">
                      <h2>
                        <Link to="/admin/services/status">Status</Link>
                      </h2>
                      <div>
                        The status service allows for easy monitoring of application downtime. Each application should
                        represent a service that is useful to the end user by itself, such as child care subsidy and
                        child care certification.
                      </div>
                    </GoAContainer>
                  </GridItem>
                </Grid>
              </>
            )}
          </Main>
          <DashboardAside>
            <SupportLinks />
            <h3>Sharing tenant access</h3>
            <div>
              <p>To give another user limited access to your realm:</p>
              <div>
                <ListWrapper>
                  <li>
                    Share the login URL below and have your user <ExternalLink link={loginUrl} text="login" /> once to
                    create their account.
                  </li>
                  <li>
                    Add the 'tenant-admin' role to the user's assigned roles from{' '}
                    <ExternalLink link={getKeycloakAdminPortalUsers()} text="here" />
                    <br />
                    (Role Mapping › Client Roles › urn:ads:platform:tenant-service › Add selected)
                  </li>
                  <li>Once granted the role, the user can access tenant admin using the URL below.</li>
                </ListWrapper>
              </div>
            </div>
            <h3>Login link</h3>
            <LinkCopyComponent text={'Copy link'} link={loginUrl} />
          </DashboardAside>
        </Page>
      </DashboardDiv>
    );
  };

  const calloutMessage = () => {
    return (
      <Main>
        <h2>{tenantName} dashboard</h2>
        <GoACallout
          heading="Access to tenant admin app requires tenant-admin role"
          type="important"
          testId="delete-modal"
        >
          <p>
            You must have the administrator role to access the tenant administration application. If you need access,
            contact the tenant owner at <a href={`mailto: ${adminEmail}`}>{adminEmail}</a>
          </p>
        </GoACallout>
      </Main>
    );
  };
  return hasAdminRole ? adminDashboard() : calloutMessage();
};
export default Dashboard;
