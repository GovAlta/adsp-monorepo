import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '@store/index';
import { fetchAccess } from '@store/access/actions';
import { User } from '@store/access/models';
import styled from 'styled-components';
import DataTable from '@components/DataTable';
import { Grid, GridItem } from '@components/Grid';
import { Aside, Main, Page } from '@components/Html';
import SupportLinks from '@components/SupportLinks';

export default function () {
  const dispatch = useDispatch();

  const { users, roles, keycloakConfig, session } = useSelector((state: RootState) => {
    return {
      users: state.access.users || [],
      roles: state.access.roles || [],
      keycloakConfig: state.config.keycloakApi,
      session: state.session,
    };
  });

  // fetch users
  useEffect(() => {
    dispatch(fetchAccess());
  }, [dispatch, session]);

  function activeUsers(): User[] {
    return users.filter((user) => user.enabled);
  }

  function getKeycloakAdminPortal() {
    return session?.realm ? `${keycloakConfig.url}/admin/${session.realm}/console` : keycloakConfig.url;
  }

  return (
    <Page>
      <Main>
        <h1>Access</h1>
        <p>
          Access allows you to add a secure sign in to you application and services with minimum effort and
          configuration. No need to deal with storing or authenticating users. It's all available out of the box.
        </p>

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
              Keycloak Admin Portal
            </a>
          </TitleLinkHeader>

          <UserStats>
            <UserStatsItem md={4}>
              <Count id="user-count">{users.length}</Count>
              Total number of users
            </UserStatsItem>
            <UserStatsItem md={4}>
              <Count id="role-count">{roles?.length ?? '-'}</Count>
              Types of user roles
            </UserStatsItem>
            <UserStatsItem md={4}>
              <Count id="active-user-count">{activeUsers().length}</Count>
              Active users
            </UserStatsItem>
          </UserStats>
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

          <DataTable id="role-information">
            <thead>
              <tr>
                <th>User role</th>
                <th>Role count</th>
              </tr>
            </thead>
            <tbody>
              {roles
                .sort((a, b) => (a.userIds?.length > b.userIds?.length ? -1 : 1))
                .slice(0, 5)
                .map((role) => {
                  return (
                    <tr key={role.name}>
                      <td>{role.name}</td>
                      <td>{role.userIds?.length ?? 0}</td>
                    </tr>
                  );
                })}
            </tbody>
          </DataTable>
        </section>
      </Main>

      <Aside>
        <h5>Helpful Links</h5>
        <a rel="noopener noreferrer" target="_blank" href="/keycloak/support">
          Keycloak Support
        </a>
        <SupportLinks />
      </Aside>
    </Page>
  );
}

// *****************
// Styled Components
// *****************

const Count = styled.div`
  font-size: var(--fs-3xl);
  font-weight: var(--fw-bold);
  padding-bottom: 1rem;
`;

const TitleLinkHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const Title = styled.div`
  font-size: var(--fs-xl);
`;

const UserStats = styled(Grid)``;

const UserStatsItem = styled(GridItem)`
  border: 1px solid #ccc;
  border-bottom-width: 0;
  padding: 1rem;
  &:last-child {
    border-bottom-width: 1px;
  }
  @media (min-width: 768px) {
    border: 1px solid #ccc;
    border-right-width: 0;
    &:last-child {
      border-right-width: 1px;
    }
  }
`;
