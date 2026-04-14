import React, { FunctionComponent, useState } from 'react';
import { Aside, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { SharePointOverview } from './overview';
import { ConnectionsView } from './connections/connectionsView';

export const SharePoint: FunctionComponent = () => {
  const [activateEditState, setActivateEditState] = useState<boolean>(false);

  return (
    <Page>
      <Main>
        <>
          <h1 data-testid="sharepoint-title">SharePoint service</h1>
          <Tabs activeIndex={0} data-testid="sharepoint-tabs">
            <Tab label="Overview" data-testid="sharepoint-overview-tab">
              <SharePointOverview />
            </Tab>
            <Tab label="Connections" data-testid="sharepoint-connections-tab">
              <ConnectionsView activeEdit={activateEditState} />
            </Tab>
          </Tabs>
        </>
      </Main>
    </Page>
  );
};
