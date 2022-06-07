import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import DataTable from '@components/DataTable';
import { Metrics } from '@components/Metrics';
import { PageIndicator } from '@components/Indicator';
import { TitleLinkHeader, TableStyle, Title } from './styled-component';
import { fetchAccess, accessReset } from '@store/access/actions';

export const Overview = (): JSX.Element => {
  const dispatch = useDispatch();
  const { userCount, activeUserCount, roles, keycloakConfig } = useSelector((state: RootState) => {
    return {
      userCount: state.access.metrics.users,
      activeUserCount: state.access.metrics.activeUsers,
      roles: state.access.roles && Object.values(state.access.roles),
      keycloakConfig: state.config.keycloakApi,
    };
  });

  const realm = useSelector((state: RootState) => {
    return state?.session?.realm;
  });

  function getKeycloakAdminPortal() {
    return realm ? `${keycloakConfig.url}/admin/${realm}/console` : keycloakConfig.url;
  }

  const isReady = (indicator, users) => {
    return !indicator.show && !!users;
  };

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  useEffect(() => {
    dispatch(fetchAccess());
  }, []);

  useEffect(() => {
    return function clean() {
      if (isReady(indicator, userCount)) {
        dispatch(accessReset());
      }
    };
  }, [indicator]);

  return (
    <>
      <h1 data-testid="access-title">Access service</h1>
      <p>
        Access allows you to add a secure sign in to your application and services with minimum effort and
        configuration. No need to deal with storing or authenticating users. It's all available out of the box.
      </p>

      <div>
        <section id="keycloak-user-info">
          <TitleLinkHeader>
            <Title>Keycloak user information</Title>
            <a
              href={getKeycloakAdminPortal()}
              rel="noopener noreferrer"
              target="_blank"
              className="link-button"
              title="Keycloak Admin"
            >
              Keycloak admin portal
            </a>
          </TitleLinkHeader>

          <Metrics
            metrics={[
              { id: 'user-count', name: 'Total number of users', value: userCount },
              { id: 'role-count', name: 'Total number of roles', value: roles?.length },
              { id: 'active-user-count', name: 'Active users', value: activeUserCount },
            ]}
          />
        </section>

        <section id="keycloak-role-info">
          <h3>Keycloak role information</h3>
          <p>
            Displayed below are the top 5 user roles based on their counts. To view all your available roles, please{' '}
            <a href={getKeycloakAdminPortal()} rel="noopener noreferrer" target="_blank">
              sign in
            </a>{' '}
            to your Keycloak admin portal.
          </p>
          <TableStyle>
            <DataTable id="role-information">
              <thead>
                <tr>
                  <th className="half-width">Role</th>
                  <th>User count</th>
                </tr>
              </thead>
              <tbody>
                {roles ? (
                  roles
                    .sort((a, b) => (a.userIds?.length > b.userIds?.length ? -1 : 1))
                    .slice(0, 5)
                    .map((role) => {
                      return (
                        <tr key={role.name}>
                          <td>{role.name}</td>
                          <td>{role.userIds?.length ?? 0}</td>
                        </tr>
                      );
                    })
                ) : (
                  <tr>
                    <td colSpan={2}>
                      <PageIndicator />
                    </td>
                  </tr>
                )}
              </tbody>
            </DataTable>
          </TableStyle>
        </section>
      </div>
    </>
  );
};
