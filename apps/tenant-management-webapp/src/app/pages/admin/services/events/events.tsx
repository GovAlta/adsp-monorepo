import { ApiDocumentation } from '@components/ApiDocumentation';
import { Aside, Main, Page } from '@components/Html';
import SupportLinks from '@components/SupportLinks';
import { Tab, Tabs } from '@components/Tabs';
import { RootState } from '@store/index';
import React, { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';
import { EventDefinitions } from './definitions';
import { EventsOverview } from './overview';

export const Events: FunctionComponent = () => {
  const eventServiceUrl = useSelector((state: RootState) => state.config.serviceUrls?.eventServiceApiUrl);
  return (
    <Page>
      <Main>
        <h2>Events</h2>
        <Tabs>
          <Tab label="Overview">
            <EventsOverview />
          </Tab>
          <Tab label="Definitions">
            <EventDefinitions />
          </Tab>
          <Tab label="Documentation">
            {eventServiceUrl && <ApiDocumentation specUrl={`${eventServiceUrl}/swagger/docs/v1`} />}
          </Tab>
        </Tabs>
      </Main>
      <Aside>
        <h5>Helpful Links</h5>
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
