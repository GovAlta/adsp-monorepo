import React, { FunctionComponent, useEffect, useState } from 'react';
import { Page, Main, Aside } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { ValueOverview } from './valueOverview';
import { ValueDefinitions } from './definitions';
import AsideLinks from '@components/AsideLinks';

export const Value: FunctionComponent = () => {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  return (
    <Page>
      <Main>
        <h1 data-testid="value-title">Value service</h1>
        <Tabs activeIndex={activeIndex}>
          <Tab label="Overview" data-testid="value-service-overview-tab">
            <ValueOverview />
          </Tab>
          <Tab label="Definitions" data-testid="value-service-definitions-tab">
            <ValueDefinitions />
          </Tab>
        </Tabs>
      </Main>

      <Aside>
        <AsideLinks serviceName="value" />
      </Aside>
    </Page>
  );
};
