import React, { useState, useEffect } from 'react';
import { GoACallout } from '@abgov/react-components';
import { GoACard } from '@abgov/react-components/experimental';
import { Link } from 'react-router-dom';
import ReactTooltip from 'react-tooltip';
import { Grid, GridItem } from '@components/Grid';
import { Main, Aside, Page } from '@components/Html';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import styled from 'styled-components';
import CopyIcon from '@icons/copy-outline.svg';
import { GoAButton as GoAButtonV2 } from '@abgov/react-components-new';
import { ReactComponent as GreenCircleCheckMark } from '@icons/green-circle-checkmark.svg';
import { ExternalLink } from '@components/icons/ExternalLink';

interface LinkCopyComponentProps {
  link: string;
}

const LinkCopyComponentWrapper = styled.div`
  position: relative;
  padding-top: 1.5rem;
`;

const CopyLinkToolTipWrapper = styled.div`
  .checkmark-icon {
    display: inline-block;
    margin-top: 0.5rem;
    margin-left: 0.5rem;
  }
  .message {
    font-size: 0.875rem;
    display: inline;
    position: absolute;
    top: 0.3rem;
    left: 2rem;
  }
  .URL-tooltip {
    width: 30rem !important;
    left: -5.5rem;
    font-size: 10px;
  }
  p {
    position: absolute;
    background: var(--color-gray-100);
    -webkit-border-radius: 10px;
    -moz-border-radius: 10px;
    border-radius: 30px;
    width: 12rem;
    height: 2.2rem;
    top: -1.5rem;
    left: 1rem;
  }

  p:before {
    content: '';
    position: absolute;
    top: 2rem;
    left: 6rem;
    z-index: 1;
    border: solid 15px transparent;
    border-right-color: var(--color-gray-100);
    border-top: 15px solid var(--color-gray-100);
    border-right: 10px solid transparent;
    border-left: 10px solid transparent;
    border-bottom: none;
  }
`;

const LinkCopyComponent = ({ link }: LinkCopyComponentProps): JSX.Element => {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isShowURL, setIsShowURL] = useState<boolean>(false);

  useEffect(() => {
    let tooltipTimer = null;
    if (isCopied === true) {
      tooltipTimer = setTimeout(() => {
        setIsCopied(false);
      }, 8 * 1000);
    }
    return () => {
      if (tooltipTimer !== null) {
        clearTimeout(tooltipTimer);
      }
    };
  }, [isCopied]);

  return (
    <LinkCopyComponentWrapper
      onMouseEnter={() => {
        setIsShowURL(true);
      }}
      onMouseLeave={() => {
        setIsShowURL(false);
      }}
    >
      {isCopied && (
        <CopyLinkToolTipWrapper>
          <p>
            <div className="checkmark-icon">
              <GreenCircleCheckMark />
            </div>
            <div className="message">Link copied to clipboard</div>
          </p>
        </CopyLinkToolTipWrapper>
      )}

      {!isCopied && isShowURL && (
        <CopyLinkToolTipWrapper>
          <p className="URL-tooltip">
            <div className="message">{link}</div>
          </p>
        </CopyLinkToolTipWrapper>
      )}
      <GoAButtonV2
        type="secondary"
        leadingIcon="link"
        onClick={() => {
          navigator.clipboard.writeText(link);
          setIsCopied(true);
        }}
      >
        Copy login link
      </GoAButtonV2>
    </LinkCopyComponentWrapper>
  );
};

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
                        <Link to="/admin/services/event">Event</Link>
                      </h2>
                      <div>
                        The event service provides tenant applications with the ability to send domain events.
                        Applications are able to leverage additional capabilities as side effects through these events.
                      </div>
                      <div>&nbsp;</div>
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
                        <Link to="/admin/services/notification">Notification</Link>
                      </h2>
                      <div>
                        The notifications service provides tenant applications with the ability to configure
                        notifications.
                      </div>
                      <div>&nbsp;</div>
                      <div>&nbsp;</div>
                    </GoACard>
                  </GridItem>
                  <GridItem md={6} vSpacing={1} hSpacing={0.5}>
                    <GoACard type="primary">
                      <h2>
                        <Link to="/admin/services/pdf">PDF</Link>
                      </h2>
                      <div>
                        The PDF service provides PDF operations like generating new PDFs from templates. It runs
                        operations as asynchronous jobs and uploads the output PDF files to the file service.
                      </div>
                    </GoACard>
                  </GridItem>
                  <GridItem md={6} vSpacing={1} hSpacing={0.5}>
                    <GoACard type="primary">
                      <h2>
                        <Link to="/admin/services/script">Script</Link>
                      </h2>
                      <div>
                        The script services provides the ability to execute configured Lua scripts. Applications can use
                        this to capture simple logic in configuration. For example, benefits calculations can be
                        configured in a script and executed via the script service API so that policy changes to the
                        formula can implemented through configuration change.
                      </div>
                      <div>&nbsp;</div>
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
                      </div>
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
                <li>
                  Once granted the role, the user can access tenant admin using the URL below.
                  <br />
                  <LinkCopyComponent link={loginUrl} />
                </li>
              </ListWrapper>
            </p>
            <br />
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

const ListWrapper = styled.ul`
  list-style-type: value;
  margin-left: 1rem;
  li {
    margin-bottom: 0.5rem;
  }
`;
