import { Aside, Main, Page } from '@components/Html';
import SupportLinks from '@components/SupportLinks';
import { Tab, Tabs } from '@components/Tabs';
import { RootState } from '@store/index';
import React, { FunctionComponent, useState } from 'react';
import { useSelector } from 'react-redux';
import { EventDefinitions } from './definitions';
import { EventsOverview } from './overview';

export const Events: FunctionComponent = () => {
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const docBaseUrl = useSelector((state: RootState) => state.config.serviceUrls?.docServiceApiUrl);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  return (
    <Page>
      <Main>
        <h1>Events</h1>
        <Tabs activeIndex={activeIndex} data-testid="events-tabs">
          <Tab label="Overview" data-testid="events-overview-tab">
            <EventsOverview
              updateActiveIndex={(index: number) => {
                setActiveIndex(index);
              }}
            />
          </Tab>
          <Tab label="Definitions" data-testid="events-definitions-tab">
            <EventDefinitions />
          </Tab>
        </Tabs>
      </Main>
      <Aside>
        <>
          <h3>Helpful links</h3>
          <a
            rel="noopener noreferrer"
            target="_blank"
            href={`${docBaseUrl}/${tenantName}&urls.primaryName=Event service`}
          >
            Read the API docs
          </a>
          <br />
          <a
            rel="noopener noreferrer"
            target="_blank"
            href="https://github.com/GovAlta/adsp-monorepo/tree/main/apps/event-service"
          >
            See the code
          </a>

          <SupportLinks />
        </>
      </Aside>
    </Page>
  );
};
