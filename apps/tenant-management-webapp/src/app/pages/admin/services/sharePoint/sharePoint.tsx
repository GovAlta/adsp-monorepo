import React, { FunctionComponent } from 'react';
import { Aside, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { SharePointOverview } from './overview';
import { ConnectionsView } from './connections/connectionsView';
import { DestinationsView } from './destinations/destinationsView';
import AsideLinks from '@components/AsideLinks';
import { AsidePadding } from '../../../../components/Html';

export const SharePoint: FunctionComponent = () => {
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
              <ConnectionsView />
            </Tab>
            <Tab label="Destinations" data-testid="sharepoint-destinations-tab">
              <DestinationsView />
            </Tab>
          </Tabs>
        </>
      </Main>
      <Aside>
        <AsidePadding>
          <AsideLinks serviceName="sharepoint" />
        </AsidePadding>
      </Aside>
    </Page>
  );
};
