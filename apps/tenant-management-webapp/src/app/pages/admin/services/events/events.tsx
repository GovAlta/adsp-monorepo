import { Aside, Main, Page } from '@components/Html';
import SupportLinks from '@components/SupportLinks';
import { Tab, Tabs } from '@components/Tabs';
import { RootState } from '@store/index';
import React, { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';
import { EventDefinitions } from './definitions';
import { EventsOverview } from './overview';

export const Events: FunctionComponent = () => {
  const tenantId = useSelector((state: RootState) => state.tenant?.id);
  const docBaseUrl = useSelector((state: RootState) => state.config.serviceUrls?.docServiceApiUrl);
  return (
    <Page>
      <Main>
        <h1>Events</h1>
        <Tabs activeIndex={0}>
          <Tab label="Overview">
            <EventsOverview />
          </Tab>
          <Tab label="Definitions">
            <EventDefinitions />
          </Tab>
        </Tabs>
      </Main>
      <Aside>
        <h3>Helpful links</h3>
        <a
          rel="noopener noreferrer"
          target="_blank"
          href={`${docBaseUrl}?tenant=${tenantId}&urls.primaryName=Event service`}
        >
          Read the API docs
        </a>
        <br />
        <a
          rel="noopener noreferrer"
          target="_blank"
          href="https://gitlab.gov.ab.ca/dio/core/core-services/-/tree/master/apps/event-service"
        >
          See the code
        </a>
        <SupportLinks />
      </Aside>
    </Page>
  );
};
