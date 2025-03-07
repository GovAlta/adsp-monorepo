import React, { FunctionComponent } from 'react';
import { Aside, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { DirectoryOverview } from './overview';

import { DirectoryService } from './services';
import { ResourceTypePage } from './resourceType/resourceType';
import AsideLinks from '@components/AsideLinks';

export const Directory: FunctionComponent = () => {
  return (
    <Page>
      <Main>
        {/* TODO: Add loading indicator after redux actions were added. */}
        <>
          <h1 data-testid="directory-title">Directory service</h1>
          <Tabs activeIndex={0} data-testid="directory-tabs">
            <Tab label="Overview" data-testid="directory-overview-tab">
              <DirectoryOverview />
            </Tab>
            <Tab label="Entries" data-testid="directory-entries-tab">
              <DirectoryService />
            </Tab>
            <Tab label="Resource types" data-testid="directory-resource-type-tab">
              <ResourceTypePage />
            </Tab>
          </Tabs>
        </>
      </Main>
      <Aside>
        <AsideLinks serviceName="directory" />
      </Aside>
    </Page>
  );
};
