import React, { FC, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Tab, Tabs } from 'react-bootstrap';
import useConfig from '../../../../utils/useConfig';
import css from './access.module.css';
import { RootState } from '../../../../store/reducers';
import { fetchAccess } from '../../../../store/access/actions';
import { User } from '../../../../store/access/types';

const AccessPage: FC = () => {
  const [activeTab, setActiveTab] = useState<string>();
  const [, state] = useConfig();

  const dispatch = useDispatch();

  const users = useSelector((state: RootState) => state.access.users);
  const roles = useSelector((state: RootState) => state.access.roles);
  const currentUser = useSelector((state: RootState) => state.user);
  const tenant = useSelector((state: RootState) => state.config.tenantAPI);
  const keycloakConfig = useSelector(
    (state: RootState) => state.config.keycloak
  );

  // fetch users
  useEffect(() => {
    dispatch(
      fetchAccess(currentUser, tenant)
    );
  }, [dispatch, currentUser, tenant]);

  function activeUsers(): User[] {
    return users.filter((user) => user.emailVerified);
  }

  return (
    <div className={css.Page}>
      <h2>Access</h2>
      {state === 'loaded' && (
        <Tabs activeKey={activeTab} onSelect={(key) => setActiveTab(key)}>
          <Tab eventKey="tab1" ref="tab1" title="Overview">
            <div className={css.Content}>
              <div className={css.Info}>
                <p>
                  Access allows you to add a secure sign in to you application
                  and services with minimum effort and configuration. No need to
                  deal with storing or authenticating users. It's all available
                  out of the box.
                </p>
                <p>
                  Access allows you to add a secure sign in to you application
                  and services with minimum effort and configuration. No need to
                  deal with storing or authenticating users. It's all available
                  out of the box.
                </p>

                <div className={css.InfoHeader}>
                  <h3 className={css.InfoTitle}>Keycloak user information</h3>
                  <a
                    href={keycloakConfig.url}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="link-button"
                    title="Keycloak Admin"
                  >
                    Keycloak Admin Portal
                  </a>
                </div>

                <div className={css.BoxSet}>
                  <div className={css.Box}>
                    <div id="user-count" className={css.BoxValue}>{users.length}</div>
                    <div className={css.BoxTitle}>Total number of users</div>
                  </div>
                  <div className={css.Box}>
                    <div id="role-count" className={css.BoxValue}>{roles?.length ?? '-'}</div>
                    <div className={css.BoxTitle}>Types of user roles</div>
                  </div>
                  <div className={css.Box}>
                    <div id="active-user-count" className={css.BoxValue}>{activeUsers().length}</div>
                    <div className={css.BoxTitle}>Active users</div>
                  </div>
                </div>

                <h3>Keycloak role information</h3>

                <p>
                  Displayed below are the top 5 user roles based on their
                  counts. To view all your available roles, please{' '}
                  <a
                    href={keycloakConfig.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    sign in
                  </a>{' '}
                  to your Keycloak admin portal.
                </p>

                <div className="goa-table">
                  <table id="role-information">
                    <thead>
                      <tr>
                        <th>User role</th>
                        <th>Role count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles
                        .sort((a, b) =>
                          a.userIds.length > b.userIds.length ? -1 : 1
                        )
                        .slice(0, 5)
                        .map((role) => {
                          return (
                            <tr key={role.name}>
                              <td>{role.name}</td>
                              <td>{role.userIds.length}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={css.Sidebar}>
                <div className={css.InfoTitle}>Helpful Links</div>
                <a
                  rel="noopener noreferrer"
                  target="_blank"
                  href="/keycloak/support"
                >
                  Keycloak Support
                </a>
              </div>
            </div>
          </Tab>

          <Tab eventKey="tab2" ref="tab2" title="Templates">
            Templates
          </Tab>

          <Tab eventKey="tab3" ref="tab3" title="Usage">
            Usage
          </Tab>

          <Tab eventKey="tab4" ref="tab4" title="API integration">
            API Integration
          </Tab>

          <Tab eventKey="tab4" ref="tab4" title="Settings">
            Settings
          </Tab>
        </Tabs>
      )}
    </div>
  );
};

export default AccessPage;
