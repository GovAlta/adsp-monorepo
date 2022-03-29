import React, { FunctionComponent } from 'react';
import { Aside, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { DirectoryOverview } from './overview';
import SupportLinks from '@components/SupportLinks';
import { DirectoryService } from './services';
export const Directory: FunctionComponent = () => {
  return (
    <Page>
      <Main>
        {/* TODO: Add loading indicator after redux actions were added. */}
        <>
          <h1>Directory service</h1>
          <Tabs activeIndex={0}>
            <Tab label="Overview">
              <DirectoryOverview />
            </Tab>
            <Tab label="Entries">
              <DirectoryService />
            </Tab>
          </Tabs>
        </>
      </Main>
      <Aside>
        <h3>Helpful links</h3>
        <a
          rel="noopener noreferrer"
          target="_blank"
          href="https://github.com/GovAlta/adsp-monorepo/tree/main/apps/tenant-management-api"
        >
          See the code
        </a>
        <SupportLinks />
      </Aside>
    </Page>
  );
};
