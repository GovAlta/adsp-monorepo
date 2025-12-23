import React, { useEffect } from 'react';
import { GoabContainer, GoabCallout, GoabGrid } from '@abgov/react-components';
import { Link } from 'react-router-dom';
import { Main, Page } from '@components/Html';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { ExternalLink } from '@components/icons/ExternalLink';
import BetaBadge from '@icons/beta-badge.svg';
import { DashboardAside, DashboardDiv, HeadingDiv, ListWrapper, DashboardMinWidth } from './styled-components';
import SupportLinks from '@components/SupportLinks';
import LinkCopyComponent from '@components/CopyLink/CopyLink';
import { serviceVariables } from '../../../../featureFlag';

import { FetchTenant } from '@store/tenant/actions';

const Dashboard = (): JSX.Element => {
  const dispatch = useDispatch();

  const tenantAdminRole = 'tenant-admin';
  const {
    config,
    realm,
    authenticated,
    session,
    tenantManagementWebApp,
    tenantName,
    adminEmail,
    hasAdminRole,
    keycloakConfig,
  } = useSelector((state: RootState) => {
    return {
      config: state.config,
      session: state.session,
      authenticated: state.session.authenticated,
      tenantManagementWebApp: state.config.serviceUrls.tenantManagementWebApp,
      tenantName: state.tenant.name,
      realm: state.session.realm,
      adminEmail: state.tenant.adminEmail,
      keycloakConfig: state.config.keycloakApi,
      hasAdminRole:
        state.session?.resourceAccess?.['urn:ads:platform:tenant-service']?.roles?.includes(tenantAdminRole),
    };
  });
  const loginUrl = `${tenantManagementWebApp}/${session.realm}/login`;

  function getKeycloakAdminPortalUsers() {
    return session?.realm
      ? `${keycloakConfig.url}/admin/${session.realm}/console/#/realms/${session.realm}/users`
      : keycloakConfig.url;
  }

  const services = serviceVariables(config.featureFlags);

  useEffect(() => {
    if (realm && authenticated) {
      dispatch(FetchTenant(realm));
    }
  }, [realm, authenticated, dispatch]);

  const adminDashboard = () => {
    return (
      <DashboardDiv>
        <Page>
          <Main>
            <DashboardMinWidth>
              {tenantName && (
                <>
                  <h1 data-testid="dashboard-title">Dashboard</h1>
                  <GoabGrid gap="s" minChildWidth="25ch">
                    {services.map((ref, index) => (
                      <GoabContainer accent="thin" type="interactive" key={index}>
                        <div>
                          <HeadingDiv>
                            <h2>
                              <Link to={services[index].link}>{services[index].name}</Link>
                            </h2>
                            {services[index].beta && (
                              <img src={BetaBadge} alt={`${services[index].name} Service`} width={39} height={23} />
                            )}
                          </HeadingDiv>
                          <div>{services[index].description}</div>
                        </div>
                      </GoabContainer>
                    ))}
                  </GoabGrid>
                </>
              )}
            </DashboardMinWidth>
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
        <GoabCallout
          heading="Access to tenant admin app requires tenant-admin role"
          type="important"
          testId="delete-modal"
        >
          <p>
            You must have the administrator role to access the tenant administration application. If you need access,
            contact the tenant owner at <a href={`mailto: ${adminEmail}`}>{adminEmail}</a>
          </p>
        </GoabCallout>
      </Main>
    );
  };
  return hasAdminRole ? adminDashboard() : calloutMessage();
};

export default Dashboard;
