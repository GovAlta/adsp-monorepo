import React, { createRef, useEffect, useState, useRef } from 'react';
import { GoAContainer, GoACallout } from '@abgov/react-components-new';
import { Link } from 'react-router-dom';
import { Grid, GridItem } from '@core-services/app-common';
import { Main, Page } from '@components/Html';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { ExternalLink } from '@components/icons/ExternalLink';
import BetaBadge from '@icons/beta-badge.svg';
import { DashboardAside, DashboardDiv, HeadingDiv, ListWrapper } from './styled-components';
import SupportLinks from '@components/SupportLinks';
import LinkCopyComponent from '@components/CopyLink/CopyLink';
import { serviceVariables } from '../../../../featureFlag';
import useWindowDimensions from '@lib/useWindowDimensions';
import { FetchTenant } from '@store/tenant/actions';

const Dashboard = (): JSX.Element => {
  const [oldWindowSize, setOldWindowSize] = useState({ width: 0 });
  const [fixedHeights, setFixedHeights] = useState([]);
  const [resetHeight, setResetHeight] = useState(true);

  const size = useWindowDimensions();

  const elementRefs = useRef([]);
  const dispatch = useDispatch();
  const [elRefs, setElRefs] = React.useState([]);
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

  const arrLength = services.length;

  useEffect(() => {
    if (elRefs.length < arrLength) {
      setElRefs((elRefs) =>
        Array(arrLength)
          .fill('1')
          .map((_, i) => elRefs[i] || createRef())
      );

      elementRefs.current = Array(arrLength)
        .fill('1')
        .map((_, i) => elRefs[i] || createRef());
    }
  }, [services, elRefs, arrLength]);

  useEffect(() => {
    const tempHeights = [];

    elementRefs.current.forEach((ref, index) => {
      if (ref.current) {
        tempHeights.push(ref.current.clientHeight);
      }
    });

    const tempFixedHeights = [];
    tempHeights.forEach((h, index) => {
      if (index % 2 === 0) {
        if (h > tempHeights[index + 1]) {
          tempFixedHeights.push(h);
          tempFixedHeights.push(h);
        } else if (tempHeights[index + 1] === undefined) {
          tempFixedHeights.push(h);
        } else {
          tempFixedHeights.push(tempHeights[index + 1]);
          tempFixedHeights.push(tempHeights[index + 1]);
        }
      }
    });

    if (oldWindowSize?.width !== size?.width || fixedHeights.length === 0 || resetHeight) {
      if (tempFixedHeights.length) {
        setFixedHeights(tempFixedHeights);
        setOldWindowSize(JSON.parse(JSON.stringify(size)));
        setResetHeight(false);
      }
    }
  }, [services, resetHeight, fixedHeights.length, oldWindowSize, size]);

  useEffect(() => {
    if (realm && authenticated) {
      dispatch(FetchTenant(realm));
    }
  }, [realm, authenticated, dispatch]);

  useEffect(() => {
    if (oldWindowSize?.width !== size?.width) {
      setResetHeight(true);
    }
  }, [size, oldWindowSize]);

  const adminDashboard = () => {
    return (
      <DashboardDiv>
        <Page>
          <Main>
            {tenantName && (
              <>
                <h1 data-testid="dashboard-title">{tenantName} dashboard</h1>
                {elementRefs.current.map(
                  (ref, index) =>
                    0 === index % 2 && (
                      <Grid key={index}>
                        <GridItem key={index} md={6} vSpacing={1} hSpacing={0.5}>
                          <GoAContainer accent="thin" type="interactive">
                            <div style={{ height: resetHeight ? 'inherit' : `${fixedHeights[index]}px` }} ref={ref}>
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
                          </GoAContainer>
                        </GridItem>

                        {services[index + 1] && (
                          <GridItem key={index + 1} md={6} vSpacing={1} hSpacing={0.5}>
                            <GoAContainer accent="thin" type="interactive">
                              <div
                                ref={elementRefs.current[index + 1]}
                                style={{ height: resetHeight ? 'inherit' : `${fixedHeights[index + 1]}px` }}
                              >
                                <HeadingDiv>
                                  <h2>
                                    <Link to={services[index + 1].link}>{services[index + 1].name}</Link>
                                  </h2>
                                  {services[index + 1].beta && (
                                    <img
                                      src={BetaBadge}
                                      alt={`${services[index + 1].name} Service`}
                                      width={39}
                                      height={23}
                                    />
                                  )}
                                </HeadingDiv>
                                <div>{services[index + 1].description}</div>
                              </div>
                            </GoAContainer>
                          </GridItem>
                        )}
                      </Grid>
                    )
                )}
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
