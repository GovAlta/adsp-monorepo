import React from 'react';
import { Aside, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { ScriptOverview } from './overview';

import SupportLinks from '@components/SupportLinks';

import { useSelector } from 'react-redux';
import { RootState } from '@store/index';

export const Script = (): JSX.Element => {
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const docBaseUrl = useSelector((state: RootState) => state.config.serviceUrls?.docServiceApiUrl);

  return (
    <Page>
      <Main>
        <>
          <h1 data-testid="calendar-title">Script service</h1>
          <Tabs activeIndex={0}>
            <Tab label="Overview">
              <ScriptOverview />
            </Tab>
          </Tabs>
        </>
      </Main>
      <Aside>
        <h3>Helpful links</h3>
        <a
          rel="noopener noreferrer"
          target="_blank"
          href={`${docBaseUrl}/${tenantName?.toLowerCase().replace(/ /g, '-')}?urls.primaryName=Script service`}
        >
          Read the API docs
        </a>
        <br />
        <a
          rel="noopener noreferrer"
          target="_blank"
          href="https://github.com/GovAlta/adsp-monorepo/tree/main/apps/script-service"
        >
          See the code
        </a>
        <SupportLinks />
      </Aside>
    </Page>
  );
};
