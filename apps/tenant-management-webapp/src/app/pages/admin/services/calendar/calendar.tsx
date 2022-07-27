import React, { FunctionComponent } from 'react';
import { Aside, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { CalendarOverview } from './overview';
import SupportLinks from '@components/SupportLinks';

import { useSelector } from 'react-redux';
import { RootState } from '@store/index';

export const Calendar: FunctionComponent = () => {
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const docBaseUrl = useSelector((state: RootState) => state.config.serviceUrls?.docServiceApiUrl);
  return (
    <Page>
      <Main>
        <>
          <h1 data-testid="calendar-title">Calendar service</h1>
          <Tabs activeIndex={0}>
            <Tab label="Overview">
              <CalendarOverview />
            </Tab>
          </Tabs>
        </>
      </Main>
      <Aside>
        <h3>Helpful links</h3>
        <a
          rel="noopener noreferrer"
          target="_blank"
          href={`${docBaseUrl}/${tenantName?.toLowerCase().replace(/ /g, '-')}?urls.primaryName=Directory service`}
        >
          Read the API docs
        </a>
        <br />
        <a
          rel="noopener noreferrer"
          target="_blank"
          href="https://github.com/GovAlta/adsp-monorepo/tree/main/apps/calendar-service"
        >
          See the code
        </a>
        <SupportLinks />
      </Aside>
    </Page>
  );
};
