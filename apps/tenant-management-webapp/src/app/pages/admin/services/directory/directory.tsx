import React, { FunctionComponent } from 'react';
import { Aside, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { DirectoryOverview } from './overview';

import { DirectoryService } from './services';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';

import AsideLinks from '@components/AsideLinks';

export const Directory: FunctionComponent = () => {
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const docBaseUrl = useSelector((state: RootState) => state.config.serviceUrls?.docServiceApiUrl);
  function getDirectoryDocsLink() {
    return `${docBaseUrl}/${tenantName?.toLowerCase().replace(/ /g, '-')}?urls.primaryName=Directory service`;
  }
  function getDirectorysupportcodeLink() {
    return 'https://github.com/GovAlta/adsp-monorepo/tree/main/apps/directory-service';
  }
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
          </Tabs>
        </>
      </Main>
      <Aside>
        <AsideLinks serviceLink={getDirectorysupportcodeLink()} docsLink={getDirectoryDocsLink()} />
      </Aside>
    </Page>
  );
};
