import React, { FunctionComponent } from 'react';
import { Aside, AsidePadding, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import AsideLinks from '@components/AsideLinks';
import { SecretOverview } from './overview';

export const Secret: FunctionComponent = () => {
  return (
    <Page>
      <Main>
        <h1 data-testid="secret-title">Secret service</h1>
        <Tabs activeIndex={0} data-testid="secret-tabs">
          <Tab label="Overview" data-testid="secret-overview-tab">
            <SecretOverview />
          </Tab>
        </Tabs>
      </Main>
      <Aside>
        <AsidePadding>
          <AsideLinks serviceName="secret" />
        </AsidePadding>
      </Aside>
    </Page>
  );
};
