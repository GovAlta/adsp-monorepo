import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { fetchAccess, accessReset } from '@store/access/actions';
import { User } from '@store/access/models';
import styled from 'styled-components';
import DataTable from '@components/DataTable';
import { Grid, GridItem } from '@components/Grid';
import { Aside, Main, Page } from '@components/Html';
import SupportLinks from '@components/SupportLinks';
import { PageIndicator } from '@components/Indicator';
export default function (): JSX.Element {
  const dispatch = useDispatch();

  const { users, roles, keycloakConfig } = useSelector((state: RootState) => {
    return {
      users: state.access.users || [],
      roles: state.access.roles || [],
      keycloakConfig: state.config.keycloakApi,
    };
  });

  const isReady = (indicator, users) => {
    return !indicator.show && users && users.length > 1
  }

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const realm = useSelector((state: RootState) => {
    return state?.session?.realm;
  });

  useEffect(() => {
    dispatch(fetchAccess());
  }, []);

  useEffect(() => {
    return function clean() {
      if (isReady(indicator, users)) {
        dispatch(accessReset());
      }
    }
  }, [indicator]);

  function activeUsers(): User[] {
    return users.filter((user) => user.enabled);
  }

  function getKeycloakAdminPortal() {
    return realm ? `${keycloakConfig.url}/admin/${realm}/console` : keycloakConfig.url;
  }

  return (
    <Page>
      <Main>
        <h1>Access</h1>
        <p>
          Access allows you to add a secure sign in to you application and services with minimum effort and
          configuration. No need to deal with storing or authenticating users. It's all available out of the box.
        </p>
        <PageIndicator />

        {isReady(indicator, users) && (
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
          </div>
        )}
      </Main>

      <Aside>
        <h4>Helpful links</h4>
        <a rel="noopener noreferrer" target="_blank" href="https://gitlab.gov.ab.ca/dio/keycloak-themes">
          See the code
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
  font-size: var(--fs-2xl);
  font-weight: var(--fw-bold);
  padding-bottom: 1rem;
`;

const TitleLinkHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const Title = styled.h2`
  && {
    margin: 0;
  }
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
