import React, { FunctionComponent } from 'react';
import { Aside, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { SharePointOverview } from './overview';

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
          </Tabs>
        </>
      </Main>
    </Page>
  );
};
