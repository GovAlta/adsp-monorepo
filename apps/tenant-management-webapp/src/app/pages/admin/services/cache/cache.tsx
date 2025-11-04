import React, { FunctionComponent, useState } from 'react';
import { Page, Main, Aside } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import BetaBadge from '@icons/beta-badge.svg';
import { HeadingDiv } from '../styled-components';
import { CacheOverview } from './cacheOverview';
import { Targets } from './targets';
import AsideLinks from '@components/AsideLinks';

export const Cache: FunctionComponent = () => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [openAddDefinition, setOpenAddDefinition] = useState<boolean>(false);

  return (
    <Page>
      <Main>
        <HeadingDiv>
          <h1 data-testid="cache-title">Cache service</h1>
          <img src={BetaBadge} alt="Cache Service" />
        </HeadingDiv>
        <Tabs activeIndex={activeIndex}>
          <Tab label="Overview" data-testid="cache-service-overview-tab">
            <CacheOverview setActiveIndex={setActiveIndex} setOpenAddDefinition={setOpenAddDefinition} />
          </Tab>
          <Tab label="Targets" data-testid="cache-service-targets-tab">
            <Targets openAddDefinition={openAddDefinition} setOpenAddDefinition={setOpenAddDefinition} />
          </Tab>
        </Tabs>
      </Main>

      <Aside>
        <AsideLinks serviceName="cache" />
      </Aside>
    </Page>
  );
};
