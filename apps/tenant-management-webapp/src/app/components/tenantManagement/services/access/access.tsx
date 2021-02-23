import React, { FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Tab, Tabs } from 'react-bootstrap';
import useConfig from '../../../../utils/useConfig';
import { AppState } from '../../../../store/reducers/initialState';

const AccessPage: FC = () => {
  const [activeTab, setActiveTab] = useState<string>();
  const [keycloakUrl, setKeycloakUrl] = useState<string>();
  const [config, state] = useConfig();

  const realmName = useSelector(
    (state: AppState) => state?.config?.keycloak?.realm ?? ''
  );

  useEffect(() => {
    if (state !== 'loaded') return;
    setKeycloakUrl(`${config.keycloakUrl}/auth/admin/${realmName}/console`);
  }, [config, state, realmName]);

  return (
    <div>
      <header>
        <h2>Access</h2>
      </header>
      {state === 'loaded' && (
        <Tabs activeKey={activeTab} onSelect={(key) => setActiveTab(key)}>
          <Tab eventKey="tab1" ref="tab1" title="Overview">
            <p>
              Access allows you to add a secure sign in to you application and
              services with minimum effort and configuration. No need to deal
              with storing or authenticating users. It's all available out of
              the box.
            </p>
            <a
              href={keycloakUrl}
              rel="noopener noreferrer"
              target="_blank"
              className="link-button"
              title="Keycloak Admin"
            >
              Manage Keycloak Admin
            </a>
          </Tab>

          <Tab eventKey="tab2" ref="tab2" title="Templates">
            more stuff
          </Tab>

          <Tab eventKey="tab3" ref="tab3" title="Usage">
            even more stuff
          </Tab>

          <Tab eventKey="tab4" ref="tab4" title="API integration">
            lots of stuff
          </Tab>
        </Tabs>
      )}
    </div>
  );
};

export default AccessPage;
