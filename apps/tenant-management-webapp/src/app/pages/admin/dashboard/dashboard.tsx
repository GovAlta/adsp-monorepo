import React, { createRef, useEffect, useState, useRef } from 'react';
import { GoAContainer } from '@abgov/react-components-new';
import { GoACallout } from '@abgov/react-components';
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
import { featuresVisible } from '../../../../featureFlag';

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

const Dashboard = (): JSX.Element => {
  //const elRef = createRef() as React.MutableRefObject<HTMLInputElement>;
  //inputRef.current[idx].focus();
  const itemsRef = useRef([]);
  const [leftHeight, setLeftHeight] = useState(0);
  const [heights, setHeights] = useState([]);
  const [height, setHeight] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    setHeight(ref?.current?.clientHeight);
  }, [ref?.current]);
  const [elRefs, setElRefs] = React.useState([]);
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

  useEffect(() => {
    itemsRef.current = itemsRef.current.slice(0, heights.length);
  }, [heights]);

  function getKeycloakAdminPortalUsers() {
    return session?.realm
      ? `${keycloakConfig.url}/admin/${session.realm}/console/#/realms/${session.realm}/users`
      : keycloakConfig.url;
  }

  const adminFunctions = [
    {
      name: 'Access',
      link: '/admin/access',
      description:
        "Access allows you to add a secure sign in to your application and services with minimum effort and configuration. No need to deal with storing or authenticating users. It's all available out of the box",
      beta: false,
    },
    {
      name: 'Calendar',
      link: '/admin/services/calendar',
      description:
        'The calendar service provides information about dates, a model of calendars, calendar events and scheduling. This service manages dates and times in a particular timezone (America/Edmonton) rather than UTC or a particular UTC offset.',
      beta: true,
    },
    {
      name: 'Configuration',
      link: '/admin/services/configuration',
      description:
        'The configuration service provides a generic json document store for storage and revisioning of infrequently changing configuration. Store configuration against namespace and name keys, and optionally define configuration schemas for write validation.',
      beta: false,
    },
    {
      name: 'Directory',
      link: '/admin/services/directory',
      description:
        'The directory service is a registry of services and their APIs. Applications can use the directory to lookup URLs for service from a common directory API. Add entries for your own services so they can be found using the directory for service discovery.',
      beta: false,
    },
    {
      name: 'Event',
      link: '/admin/services/event',
      description:
        'The event service provides tenant applications with the ability to send domain events. Applications are able to leverage additional capabilities as side effects through these events.',
      beta: false,
    },
    {
      name: 'File',
      link: '/admin/services/file',
      description:
        'The file service provides the capability to upload and download files. Consumers are registered with their own space (tenant) containing file types that include role based access policy, and can associate files to domain records.',
      beta: false,
    },
    {
      name: 'Form',
      link: '/admin/services/form',
      description:
        'The form service provides capabilities to support user form submission. Form definitions are used to describe types of form with roles for applicants, clerks who assist them, and assessors who process the submissions.',
      beta: true,
    },
    {
      name: 'Notification',
      link: '/admin/services/notification',
      description:
        'The notifications service provides tenant applications with the ability to configure notifications.',
      beta: false,
    },
    {
      name: 'PDF',
      link: '/admin/services/pdf',
      description:
        'The PDF service provides PDF operations like generating new PDFs from templates. It runs operations as asynchronous jobs and uploads the output PDF files to the file service.',
      beta: false,
    },
    {
      name: 'Script',
      link: '/admin/services/script',
      description:
        'The script services provides the ability to execute configured Lua scripts. Applications can use this to capture simple logic in configuration. For example, benefits calculations can be configured in a script and executed via the script service API so that policy changes to the formula can implemented through configuration change.',
      beta: true,
    },
    {
      name: 'Status',
      link: '/admin/services/status',
      description:
        'The status service allows for easy monitoring of application downtime. Each application should represent a service that is useful to the end user by itself, such as child care subsidy and child care certification.',
      beta: false,
    },
  ];

  const filteredAdminFunction = adminFunctions.filter((adminF) => {
    // console.log(JSON.stringify(adminF.name) + '<adminF.name');
    // console.log(JSON.stringify(featuresVisible[adminF.name]) + '<featuresVisible[adminF.name]');

    return !(adminF.name === featuresVisible[adminF.name] && featuresVisible[adminF.name] === false);
  });

  const arrLength = filteredAdminFunction.length;

  useEffect(() => {
    // add or remove refs
    setElRefs((elRefs) => {
      console.log(JSON.stringify(Array(arrLength)) + '<Array(arrLength)');
      return Array(arrLength)
        .fill(0)
        .map((_, i) => {
          console.log('ASDF');
          console.log(JSON.stringify(elRefs[i] || createRef()) + '<elRefs[i] || createRef()');
          console.log(JSON.stringify(elRefs[i]) + '<elRefs[i] || createRef()');
          return elRefs[i] || createRef();
        });
    });
  }, [arrLength]);

  useEffect(() => {
    console.log('do we ever');
    console.log(elRefs[0]?.current?.clientHeight + '<get clientheight');
    if (!elRefs[0]?.current?.clientHeight) {
      return;
    }
    console.log('get here');
    setHeight(elRefs[0]?.current?.clientHeight);
  }, [elRefs]);

  // useEffect(() => {
  //   console.log(JSON.stringify(elRef?.current?.clientHeight) + '<42');
  // }, [elRef?.current?.clientHeight]);

  // useEffect(() => {
  //   if (!elRef?.current?.clientHeight) {
  //     return;
  //   }
  //   if (leftHeight !== elRef?.current?.clientHeight) setLeftHeight(elRef?.current?.clientHeight);
  //   if (leftHeight !== elRef?.current?.clientHeight) setRightHeight(elRef?.current?.clientHeight);
  // }, [elRef]);

  // useEffect(() => {
  //   if (!itemsRef?.current) {
  //     return;
  //   }
  //   if (he !== elRef?.current?.clientHeight) setLeftHeight(elRef?.current?.clientHeight);
  //   if (leftHeight !== elRef?.current?.clientHeight) setRightHeight(elRef?.current?.clientHeight);
  // }, [itemsRef]);

  console.log(arrLength + '<---arrLength');
  console.log(height + '<---height');
  console.log(JSON.stringify(elRefs.map((e) => e.current?.clientHeight)) + '<---elRefs');
  console.log(JSON.stringify(typeof elRefs[0]) + '<---elRefs type');
  console.log(JSON.stringify(elRefs[0]?.current?.clientHeight) + '<---elRefs0');

  const adminDashboard = () => {
    return (
      <DashboardDiv>
        <Page>
          <Main>
            {tenantName && (
              <>
                <h1 data-testid="dashboard-title">{tenantName} dashboard</h1>

                {filteredAdminFunction.map(
                  (func, index) =>
                    0 === index % 2 && (
                      <Grid ref={ref}>
                        <GridItem key={index} md={6} vSpacing={1} hSpacing={0.5}>
                          <GoAContainer accent="thin" type="interactive">
                            {height}
                            <div
                              style={{ height: '400px' }}
                              // ref={(el) => {
                              //   //console.log(JSON.stringify(el, getCircularReplacer()) + 'el');
                              //   return (itemsRef.current[index] = el);
                              // }}
                              ref={elRefs[index]}
                            >
                              <HeadingDiv>
                                <h2>
                                  <Link to={func.link}>{func.name}</Link>
                                </h2>
                                {func.beta && (
                                  <img src={BetaBadge} alt={`${func.name} Service`} width={39} height={23} />
                                )}
                              </HeadingDiv>
                              <div>{func.description}</div>
                            </div>
                          </GoAContainer>
                        </GridItem>

                        {filteredAdminFunction[index + 1] && (
                          <GridItem key={index + 1} md={6} vSpacing={1} hSpacing={0.5}>
                            <GoAContainer accent="thin" type="interactive">
                              <HeadingDiv>
                                <h2>
                                  <Link to={filteredAdminFunction[index + 1].link}>
                                    {filteredAdminFunction[index + 1].name}
                                  </Link>
                                </h2>
                                {filteredAdminFunction[index + 1].beta && (
                                  <img
                                    src={BetaBadge}
                                    alt={`${filteredAdminFunction[index + 1].name} Service`}
                                    width={39}
                                    height={23}
                                  />
                                )}
                              </HeadingDiv>
                              <div>{filteredAdminFunction[index + 1].description}</div>
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
        <GoACallout type="important" data-testid="delete-modal">
          <h3>Access to tenant admin app requires tenant-admin role</h3>
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
