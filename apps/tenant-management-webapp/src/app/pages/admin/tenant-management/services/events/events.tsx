import { ApiDocumentation } from '@components/ApiDocumentation';
import { Main } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { RootState } from '@store/index';
import React, { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';
import { EventsOverview } from './overview';

export const Events: FunctionComponent = () => {
  const eventServiceUrl = useSelector((state: RootState) => state.config.serviceUrls?.eventServiceApiUrl);
  return (
    <Main>
      <h2>Access</h2>
      <Tabs>
        <Tab label="Overview">
          <EventsOverview />
        </Tab>
        <Tab label="Definitions">
          <section></section>
        </Tab>
        <Tab label="Documentation">
          {eventServiceUrl && <ApiDocumentation specUrl={`${eventServiceUrl}/swagger/docs/v1`} />}
        </Tab>
      </Tabs>
    </Main>
  );
};
