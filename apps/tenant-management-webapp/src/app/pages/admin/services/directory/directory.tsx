import React, { FunctionComponent } from 'react';
import { Aside, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { DirectoryOverview } from './overview';
import SupportLinks from '@components/SupportLinks';
import { DirectoryService } from './services';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { Gapadjustment, Hyperlinkcolor } from '@pages/admin/dashboard/styled-components';
import { ExternalLink } from '@components/icons/ExternalLink';

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
        <>
          <Gapadjustment>Helpful links</Gapadjustment>
          <Hyperlinkcolor>
            <ExternalLink link={getDirectoryDocsLink()} text="Read the API docs" />
          </Hyperlinkcolor>

          <Hyperlinkcolor>
            <ExternalLink link={getDirectorysupportcodeLink()} text="See the code" />
          </Hyperlinkcolor>

          <SupportLinks />
        </>
      </Aside>
    </Page>
  );
};
