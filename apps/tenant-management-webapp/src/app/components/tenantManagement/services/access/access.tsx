import React, { FC, useEffect, useState } from 'react';
import { Tab, Tabs } from 'react-bootstrap';
import useConfig from '../../../../utils/useConfig';

const AccessPage: FC = () => {
  const [activeTab, setActiveTab] = useState<string>();
  const [keycloakUrl, setKeycloakUrl] = useState<string>();
  const [config, state] = useConfig();

  useEffect(() => {
    if (state !== 'loaded') return;
    // TODO: need to get the user specific realm for the user
    const realm = 'core';
    setKeycloakUrl(`${config.keycloakUrl}/auth/admin/${realm}/console`);
  }, [config, state]);

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
              className="link-button"
              title="Keycloak Admin"
            >
              Manage Keycloak Admin
              <img
                src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+IDxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxwYXRoIGQ9Ik0xOCwxMC44MmExLDEsMCwwLDAtMSwxVjE5YTEsMSwwLDAsMS0xLDFINWExLDEsMCwwLDEtMS0xVjhBMSwxLDAsMCwxLDUsN2g3LjE4YTEsMSwwLDAsMCwwLTJINUEzLDMsMCwwLDAsMiw4VjE5YTMsMywwLDAsMCwzLDNIMTZhMywzLDAsMCwwLDMtM1YxMS44MkExLDEsMCwwLDAsMTgsMTAuODJabTMuOTItOC4yYTEsMSwwLDAsMC0uNTQtLjU0QTEsMSwwLDAsMCwyMSwySDE1YTEsMSwwLDAsMCwwLDJoMy41OUw4LjI5LDE0LjI5YTEsMSwwLDAsMCwwLDEuNDIsMSwxLDAsMCwwLDEuNDIsMEwyMCw1LjQxVjlhMSwxLDAsMCwwLDIsMFYzQTEsMSwwLDAsMCwyMS45MiwyLjYyWiIvPjwvc3ZnPg=="
                className="external-link"
                alt="file-service-support"
              ></img>
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
