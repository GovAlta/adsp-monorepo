import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '@store/index';
import { fetchAccess } from '@store/access/actions';
import { User } from '@store/access/models';
import styled from 'styled-components';

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
    <AccessPage>
      <main>
        <h2>Access</h2>
        <p>
          Access allows you to add a secure sign in to you application and services with minimum effort and
          configuration. No need to deal with storing or authenticating users. It's all available out of the box.
        </p>

        <section id="keycloak-user-info">
          <TitleLinkHeader>
            <h3>Keycloak user information</h3>
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
            <div>
              <Count id="user-count">{users.length}</Count>
              <div>Total number of users</div>
            </div>
            <div>
              <Count id="role-count">{roles?.length ?? '-'}</Count>
              <div>Types of user roles</div>
            </div>
            <div>
              <Count id="active-user-count">{activeUsers().length}</Count>
              <div>Active users</div>
            </div>
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
      </main>

      <Links>
        <h5>Helpful Links</h5>
        <a rel="noopener noreferrer" target="_blank" href="/keycloak/support">
          Keycloak Support
        </a>
      </Links>
    </AccessPage>
  );
}

// *****************
// Styled Components
// *****************

const Count = styled.div`
  font-size: var(--fs-3xl);
  font-weight: var(--fw-bold);
`;

const TitleLinkHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;

  h3 {
    margin: 0;
  }
`;

const AccessPage = styled.div`
  display: flex;
  flex-direction: column;
  @media (min-width: 1024px) {
    flex-direction: row;
  }
`;

const Links = styled.section`
  @media (min-width: 1024px) {
    flex: 0 0 200px;
    padding-left: 2rem;
  }
`;

const UserStats = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    flex-direction: row;
  }

  > div {
    flex: 1 1 33%;
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
  }

  h4 {
    font-size: var(--fs-4xl);
    font-weight: var(--fw-bold);
  }
`;

const DataTable = styled.table`
  margin-bottom: 1.5rem;
  width: 100%;
  thead th {
    font-size: var(--fs-lg);
    border-bottom: 2px solid #ccc;
  }
  tbody tr:nth-child(even) {
    background-color: #fafafa;
  }
  tbody td {
    padding: 0.5rem 0;
  }
`;
